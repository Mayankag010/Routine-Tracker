"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/settings/Toggle";
import {
  notificationsSupported,
  getPermissionStatus,
  requestNotificationPermission,
} from "@/lib/notifications";

const TOGGLE_DEFS = [
  {
    key: "routineReminders",
    label: "Routine reminders",
    description: "Get notified when a scheduled routine is approaching.",
  },
  {
    key: "streakReminders",
    label: "Streak reminders",
    description: "Get reminded when you are at risk of losing a streak.",
  },
  {
    key: "missedRoutineNotifications",
    label: "Missed routine notifications",
    description: "A gentle nudge when a routine's reminder time has passed and it's still not done.",
  },
  {
    key: "achievementNotifications",
    label: "Achievement notifications",
    description: "Celebrate streak milestones like 7, 30, or 100 days.",
  },
  {
    key: "goalNotifications",
    label: "Goal notifications",
    description: "Updates on any goals you set. (Goals are coming soon — this is ready for when they land.)",
  },
  {
    key: "dailySummary",
    label: "Daily summary",
    description: "A recap of today's routines, sent at the time below.",
  },
  {
    key: "weeklyProgressSummary",
    label: "Weekly progress summary",
    description: "A recap of your week, sent on the day and time below.",
  },
];

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function NotificationsSettings({ prefs, onSave }) {
  const [permission, setPermission] = useState("unsupported");

  useEffect(() => {
    setPermission(getPermissionStatus());
  }, []);

  async function handleEnableBrowserNotifications() {
    const status = await requestNotificationPermission();
    setPermission(status);
    if (status === "granted") {
      onSave({ notifications: { ...prefs.notifications, enabled: true } });
    }
  }

  function setToggle(key, value) {
    onSave({ notifications: { ...prefs.notifications, [key]: value } });
  }

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Notifications</h2>

      <div className="rounded-xl border border-line px-5 py-4 mb-6">
        {!notificationsSupported() ? (
          <p className="text-sm text-inkSoft">Your browser doesn't support notifications.</p>
        ) : permission === "granted" ? (
          <p className="text-sm text-accent">Notifications enabled ✓</p>
        ) : permission === "denied" ? (
          <p className="text-sm text-inkSoft">
            Notifications are blocked by your browser. Please enable them in your browser
            settings for this site.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-inkSoft">
              Turn on browser notifications to receive any of the alerts below.
            </p>
            <button
              onClick={handleEnableBrowserNotifications}
              className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm text-paper hover:brightness-110 transition-colors"
            >
              Enable Notifications
            </button>
          </div>
        )}
      </div>

      <Toggle
        label="Enable notifications"
        description="Master switch for every notification type below."
        checked={Boolean(prefs.notifications.enabled)}
        onChange={(v) => onSave({ notifications: { ...prefs.notifications, enabled: v } })}
        disabled={permission !== "granted"}
      />

      <div className="divide-y divide-line border-t border-line mt-2">
        {TOGGLE_DEFS.map((def) => (
          <Toggle
            key={def.key}
            label={def.label}
            description={def.description}
            checked={Boolean(prefs.notifications[def.key])}
            onChange={(v) => setToggle(def.key, v)}
            disabled={!prefs.notifications.enabled}
          />
        ))}
      </div>

      <div className="mt-4">
        <Toggle
          label="Smart reminders"
          description="If a routine isn't done shortly after its reminder time, send one gentle nudge (not repeated)."
          checked={Boolean(prefs.smartRemindersEnabled)}
          onChange={(v) => onSave({ smartRemindersEnabled: v })}
          disabled={!prefs.notifications.enabled}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <label className="block">
          <span className="block text-sm text-inkSoft mb-1">Daily summary time</span>
          <input
            type="time"
            value={prefs.dailySummaryTime}
            onChange={(e) => onSave({ dailySummaryTime: e.target.value })}
            disabled={!prefs.notifications.dailySummary}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="block text-sm text-inkSoft mb-1">Weekly summary day & time</span>
          <div className="flex gap-2">
            <select
              value={prefs.weeklySummaryDay}
              onChange={(e) => onSave({ weeklySummaryDay: Number(e.target.value) })}
              disabled={!prefs.notifications.weeklyProgressSummary}
              className="w-1/2 rounded-lg border border-line bg-surface px-3 py-2.5 text-ink focus:border-accent disabled:opacity-50"
            >
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={prefs.weeklySummaryTime}
              onChange={(e) => onSave({ weeklySummaryTime: e.target.value })}
              disabled={!prefs.notifications.weeklyProgressSummary}
              className="w-1/2 rounded-lg border border-line bg-surface px-3 py-2.5 text-ink focus:border-accent disabled:opacity-50"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
