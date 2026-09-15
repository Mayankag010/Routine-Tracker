"use client";

import { useEffect, useState } from "react";
import { subscribeCompletionValue } from "@/lib/routines";
import { getTarget, formatMinutesShort, progressPercent } from "@/lib/routine-types";
import { toDateKey } from "@/lib/schedule";
import { formatDurationShort } from "@/lib/timer/format";

/**
 * `liveSeconds` is however much of the *current* run should count toward
 * today's progress preview (elapsed for countdown/stopwatch, focus-time-so-far
 * for pomodoro) — added on top of whatever's already saved for today, so the
 * bar updates live while a session runs, without writing anything to
 * Firestore until the session actually completes (Part 10/21 of the spec).
 */
export function RoutineSessionSelect({ routines, value, onChange, disabled, liveSeconds = 0 }) {
  const routine = routines?.find((r) => r.id === value) || null;
  const [progress, setProgress] = useState({ value: 0, done: false });
  // Computed on every render rather than once at module load — a module-
  // level constant would freeze at whatever moment this chunk first
  // loaded and silently point at the wrong day's completion doc for
  // anyone who keeps the Timer tab open across midnight.
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    if (!routine) {
      setProgress({ value: 0, done: false });
      return;
    }
    return subscribeCompletionValue(routine.id, todayKey, setProgress);
  }, [routine?.id, todayKey]);

  if (!routines || routines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-inkSoft">
        Add a duration-type routine on the Routines page to track sessions against a daily goal.
      </div>
    );
  }

  const target = routine ? getTarget(routine) : 0;
  const liveMinutes = Math.max(0, liveSeconds) / 60;
  const totalMinutes = progress.value + liveMinutes;
  const percent = routine ? progressPercent(totalMinutes, target) : 0;

  return (
    <div>
      <label className="block">
        <span className="block text-sm text-inkSoft mb-1">Track this session</span>
        <select
          value={value || ""}
          onChange={(e) => {
            const id = e.target.value || null;
            const name = routines.find((r) => r.id === id)?.name || "";
            onChange(id, name);
          }}
          disabled={disabled}
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent disabled:opacity-60"
        >
          <option value="">No routine</option>
          {routines.map((r) => (
            <option key={r.id} value={r.id}>
              {r.icon ? `${r.icon} ` : ""}
              {r.name}
            </option>
          ))}
        </select>
      </label>

      {routine && (
        <div className="mt-3 rounded-lg border border-line bg-surface/40 px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-ink">{routine.name}</span>
            <span className="tabular-nums text-inkSoft">
              {formatDurationShort(totalMinutes * 60)} / {formatMinutesShort(target)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-paperDark overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${percent}%`, backgroundColor: routine.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
