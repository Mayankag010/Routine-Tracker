"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Timer as TimerIcon } from "lucide-react";
import { loadTimerState } from "@/lib/timer/storage";
import { formatClock, formatClockLong } from "@/lib/timer/format";
import { getTarget } from "@/lib/routine-types";

function countdownRemaining(s) {
  if (!s) return null;
  if (s.status === "running" && s.startedAtMs) {
    return Math.max(0, s.remainingSeconds - (Date.now() - s.startedAtMs) / 1000);
  }
  if (s.status === "paused") return s.remainingSeconds;
  return null;
}

function stopwatchElapsed(s) {
  if (!s) return null;
  if (s.status === "running" && s.startedAtMs) {
    return s.elapsedSeconds + (Date.now() - s.startedAtMs) / 1000;
  }
  if (s.status === "paused") return s.elapsedSeconds;
  return null;
}

function pomodoroRemaining(s) {
  if (!s) return null;
  if (s.status === "running" && s.startedAtMs) {
    return { phase: s.phase, seconds: Math.max(0, s.remainingSeconds - (Date.now() - s.startedAtMs) / 1000) };
  }
  if (s.status === "paused") return { phase: s.phase, seconds: s.remainingSeconds };
  return null;
}

/**
 * Deliberately tiny — just enough to show whether something is running and
 * a way in. The full Timer experience only ever lives on /timer (Part 18).
 * Polls localStorage (not Firestore) so it costs nothing extra to show here.
 */
export function TimerQuickCard({ routines = [] }) {
  // Idle display follows the first duration routine scheduled today
  // (e.g. Walking = 10 min -> 10:00). Falls back to 25:00 when there is none.
  const firstRoutine = routines[0] || null;
  const idleLabel = firstRoutine ? firstRoutine.name : "Timer";
  const idleValue = formatClock((firstRoutine ? getTarget(firstRoutine) : 25) * 60);
  const [display, setDisplay] = useState({ label: idleLabel, value: idleValue });

  useEffect(() => {
    function refresh() {
      const countdown = loadTimerState("countdown");
      const stopwatch = loadTimerState("stopwatch");
      const pomodoro = loadTimerState("pomodoro");

      if (countdown?.status === "running") {
        setDisplay({ label: "Countdown running", value: formatClock(countdownRemaining(countdown)) });
        return;
      }
      const runningPomo = pomodoro?.status === "running" ? pomodoroRemaining(pomodoro) : null;
      if (runningPomo) {
        setDisplay({
          label: runningPomo.phase === "focus" ? "Focus running" : "Break running",
          value: formatClock(runningPomo.seconds),
        });
        return;
      }
      if (stopwatch?.status === "running") {
        setDisplay({ label: "Stopwatch running", value: formatClockLong(stopwatchElapsed(stopwatch)) });
        return;
      }
      // Paused sessions, in the same priority order as running ones above —
      // previously only a paused countdown was surfaced here; a paused
      // stopwatch or pomodoro silently fell through to the generic idle
      // "Timer / 25:00" display as if nothing was in progress.
      if (countdown?.status === "paused") {
        setDisplay({ label: "Countdown paused", value: formatClock(countdownRemaining(countdown)) });
        return;
      }
      const pausedPomo = pomodoro?.status === "paused" ? pomodoroRemaining(pomodoro) : null;
      if (pausedPomo) {
        setDisplay({
          label: pausedPomo.phase === "focus" ? "Focus paused" : "Break paused",
          value: formatClock(pausedPomo.seconds),
        });
        return;
      }
      if (stopwatch?.status === "paused") {
        setDisplay({ label: "Stopwatch paused", value: formatClockLong(stopwatchElapsed(stopwatch)) });
        return;
      }
      setDisplay({ label: idleLabel, value: idleValue });
    }

    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [idleLabel, idleValue]);

  return (
    <Link
      href={firstRoutine ? `/timer?routine=${firstRoutine.id}` : "/timer"}
      className="flex items-center justify-between rounded-xl border border-line bg-surface/40 px-4 py-3 hover:border-ink transition-colors"
    >
      <div className="flex items-center gap-3">
        <TimerIcon size={18} className="text-inkSoft" />
        <div>
          <p className="text-xs text-inkSoft">{display.label}</p>
          <p className="font-display text-xl tabular-nums">{display.value}</p>
        </div>
      </div>
      <span className="text-sm text-accent">Open Timer</span>
    </Link>
  );
}
