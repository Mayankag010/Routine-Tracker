"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribePreferences } from "@/lib/preferences";
import { subscribeReminders } from "@/lib/reminders";
import { subscribeRoutines } from "@/lib/routines";
import { useCompletionSummary } from "@/lib/useCompletionSummary";
import { useRoutineDoneDates } from "@/lib/useRoutineDoneDates";
import { currentStreak, overallBestStreak } from "@/lib/streaks";
import { routineAppliesOnDate, toDateKey, addDays } from "@/lib/schedule";
import { getPermissionStatus, showNotification } from "@/lib/notifications";

const LOOKBACK_KEY_PREFIX = "notif-fired:";
const MILESTONES = [7, 14, 30, 50, 100, 150];

function fired(key) {
  try {
    return window.localStorage.getItem(LOOKBACK_KEY_PREFIX + key) === "1";
  } catch {
    return false;
  }
}
function markFired(key) {
  try {
    window.localStorage.setItem(LOOKBACK_KEY_PREFIX + key, "1");
  } catch {
    // localStorage unavailable (private mode, quota) — worst case a
    // notification repeats once, which beats crashing.
  }
}

function parseMinutes(hhmm) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function reminderAppliesToday(reminder, dayOfWeek) {
  const repeat = reminder.repeat || { type: "daily" };
  switch (repeat.type) {
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6;
    case "custom":
      return (repeat.days || []).includes(dayOfWeek);
    case "once":
      return !reminder.firedOnce;
    case "daily":
    default:
      return true;
  }
}

/**
 * No UI — mounted once inside AppShell so it runs on every authenticated
 * page. Polls roughly every 20s (there's no reliable background timer in a
 * plain client-only PWA without a push server, so this only fires while
 * the app is open in a tab) and shows a real browser notification via
 * notifications.js when something is actually due. Every check is gated on
 * the relevant Settings toggle and deduplicated per day/id in localStorage
 * so nothing repeats or spams.
 */
export function NotificationScheduler() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [routines, setRoutines] = useState(null);
  const [, forceTick] = useState(0);

  const today = new Date();
  const todayKey = toDateKey(today);
  const lookbackKey = toDateKey(addDays(today, -180));

  const summary = useCompletionSummary(routines, lookbackKey, todayKey);
  const doneMap = useRoutineDoneDates(routines, lookbackKey, todayKey);

  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribePreferences(user.uid, setPrefs),
      subscribeReminders(user.uid, setReminders),
      subscribeRoutines(user.uid, setRoutines),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 20_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!prefs || !routines || getPermissionStatus() !== "granted") return;
    if (!prefs.notifications?.enabled) return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.getDay();

    // 1. Routine reminders + smart "don't forget" nudges
    if (prefs.notifications.routineReminders) {
      for (const reminder of reminders) {
        if (!reminder.enabled) continue;
        if (!reminderAppliesToday(reminder, dayOfWeek)) continue;
        const targetMinutes = parseMinutes(reminder.time) - (reminder.offsetMinutes || 0);
        const key = `reminder:${reminder.id}:${todayKey}`;
        if (nowMinutes === targetMinutes && !fired(key)) {
          markFired(key);
          showNotification(reminder.routineName || "Routine reminder", {
            body:
              reminder.offsetMinutes > 0
                ? `${reminder.routineName} starts in ${reminder.offsetMinutes} minutes.`
                : `Time for ${reminder.routineName}.`,
            tag: key,
          });
        }

        // Smart reminder: routine still not done a while after its reminder passed.
        if (prefs.smartRemindersEnabled && prefs.notifications.missedRoutineNotifications) {
          const doneToday = doneMap[reminder.routineId]?.has(todayKey);
          const missedKey = `missed:${reminder.routineId}:${todayKey}`;
          const scheduledMinutes = parseMinutes(reminder.time);
          if (!doneToday && nowMinutes >= scheduledMinutes + 30 && !fired(missedKey)) {
            markFired(missedKey);
            showNotification("Don't forget", {
              body: `Don't forget: ${reminder.routineName}`,
              tag: missedKey,
            });
          }
        }
      }
    }

    // 2. Streak protection — evening check for at-risk streaks.
    if (prefs.notifications.streakReminders && nowMinutes >= 19 * 60) {
      for (const routine of routines) {
        if (!routineAppliesOnDate(routine, today)) continue;
        const doneToday = doneMap[routine.id]?.has(todayKey);
        if (doneToday) continue;
        const streak = currentStreak(routine, doneMap[routine.id] || new Set(), lookbackKey, toDateKey(addDays(today, -1)));
        const key = `streak-risk:${routine.id}:${todayKey}`;
        if (streak > 0 && !fired(key)) {
          markFired(key);
          showNotification("Streak at risk", {
            body: `🔥 Your ${streak}-day ${routine.name} streak is at risk.`,
            tag: key,
          });
        }
      }
    }

    // 3. Achievement notifications — one-time streak milestones per routine.
    if (prefs.notifications.achievementNotifications) {
      for (const routine of routines) {
        const streak = currentStreak(routine, doneMap[routine.id] || new Set(), lookbackKey, todayKey);
        if (!MILESTONES.includes(streak)) continue;
        const key = `achievement:${routine.id}:${streak}`;
        if (!fired(key)) {
          markFired(key);
          showNotification("Achievement unlocked 🎉", {
            body: `${streak}-day streak on ${routine.name}!`,
            tag: key,
          });
        }
      }
    }

    // 4. Daily summary
    if (prefs.notifications.dailySummary) {
      const targetMinutes = parseMinutes(prefs.dailySummaryTime);
      const key = `daily-summary:${todayKey}`;
      if (nowMinutes === targetMinutes && !fired(key)) {
        markFired(key);
        const stats = summary[todayKey] || { scheduled: 0, done: 0 };
        const best = overallBestStreak(summary, lookbackKey, todayKey);
        showNotification("Today's Routine Summary", {
          body: `${stats.scheduled} routines scheduled, ${stats.done} completed, ${Math.max(
            0,
            stats.scheduled - stats.done
          )} remaining. 🔥 Best streak: ${best} days`,
          tag: key,
        });
      }
    }

    // 5. Weekly summary
    if (prefs.notifications.weeklyProgressSummary) {
      const targetMinutes = parseMinutes(prefs.weeklySummaryTime);
      const key = `weekly-summary:${todayKey}`;
      if (
        dayOfWeek === Number(prefs.weeklySummaryDay ?? 0) &&
        nowMinutes === targetMinutes &&
        !fired(key)
      ) {
        markFired(key);
        const weekStartKey = toDateKey(addDays(today, -6));
        let totalScheduled = 0;
        let totalDone = 0;
        let activeDays = 0;
        for (let i = 0; i < 7; i++) {
          const k = toDateKey(addDays(today, -i));
          const s = summary[k];
          if (s && s.scheduled > 0) {
            totalScheduled += s.scheduled;
            totalDone += s.done;
            if (s.done > 0) activeDays++;
          }
        }
        const pct = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;
        const best = overallBestStreak(summary, weekStartKey, todayKey);
        showNotification("Your weekly progress", {
          body: `${pct}% completion, ${totalDone} routines completed, ${activeDays} active days. 🔥 Best streak: ${best} days`,
          tag: key,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, reminders, routines, doneMap, summary, todayKey]);

  return null;
}
