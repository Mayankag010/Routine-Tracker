"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCountdownEngine } from "@/lib/timer/useCountdownEngine";
import { logTimerSession } from "@/lib/timer/sessions";
import { addDurationProgress } from "@/lib/routines";
import { getTarget } from "@/lib/routine-types";
import { toDateKey } from "@/lib/schedule";
import { formatClock } from "@/lib/timer/format";
import { RoutineSessionSelect } from "./RoutineSessionSelect";

const PRESET_MINUTES = [5, 10, 15, 25, 30, 45, 60];

export function CountdownTimer({ durationRoutines }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [customMinutes, setCustomMinutes] = useState(25);

  async function handleComplete({ durationSeconds, startedAtIso, endedAtIso, routineId, routineName }) {
    if (!user) return;
    try {
      await logTimerSession(user.uid, {
        timerType: "countdown",
        durationSeconds,
        startedAt: startedAtIso,
        endedAt: endedAtIso,
        routineId,
        routineName,
      });
      if (routineId) {
        const routine = durationRoutines?.find((r) => r.id === routineId);
        if (routine) {
          await addDurationProgress(routine.id, toDateKey(new Date()), durationSeconds / 60, getTarget(routine));
        }
      }
    } catch {
      setError("Session finished, but couldn't be saved.");
    }
  }

  const { status, durationSeconds, remainingSeconds, routineId, start, pause, reset, setDuration, setRoutine } =
    useCountdownEngine({ onComplete: handleComplete });

  const elapsedForRoutine = Math.max(0, durationSeconds - remainingSeconds);
  const running = status === "running";
  const editable = status === "idle" || status === "done";

  function applyPreset(minutes) {
    if (!editable) return;
    setCustomMinutes(minutes);
    setDuration(minutes * 60);
  }

  function applyCustom(e) {
    e.preventDefault();
    if (!editable) return;
    const minutes = Math.max(1, Math.round(Number(customMinutes) || 0));
    setCustomMinutes(minutes);
    setDuration(minutes * 60);
  }

  return (
    <div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</p>
      )}

      <div className="flex flex-col items-center py-8">
        <p
          className="font-display text-5xl md:text-7xl tabular-nums tracking-tight"
          aria-live="polite"
        >
          {status === "done" ? "Time's up" : formatClock(remainingSeconds)}
        </p>
        {status === "done" && <p className="text-sm text-inkSoft mt-2">Nice work.</p>}

        <div className="flex items-center gap-3 mt-8">
          {status === "idle" && (
            <button
              onClick={start}
              disabled={durationSeconds <= 0}
              aria-label="Start countdown"
              className="rounded-full bg-ink px-8 py-3 text-paper hover:brightness-110 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              <Play size={18} /> Start
            </button>
          )}
          {status === "running" && (
            <>
              <button
                onClick={pause}
                aria-label="Pause countdown"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <Pause size={18} /> Pause
              </button>
              <button
                onClick={reset}
                aria-label="Reset countdown"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <RotateCcw size={18} /> Reset
              </button>
            </>
          )}
          {status === "paused" && (
            <>
              <button
                onClick={start}
                aria-label="Resume countdown"
                className="rounded-full bg-ink px-6 py-3 text-paper hover:brightness-110 transition-colors flex items-center gap-2"
              >
                <Play size={18} /> Resume
              </button>
              <button
                onClick={reset}
                aria-label="Reset countdown"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <RotateCcw size={18} /> Reset
              </button>
            </>
          )}
          {status === "done" && (
            <button
              onClick={reset}
              aria-label="Start countdown again"
              className="rounded-full bg-ink px-8 py-3 text-paper hover:brightness-110 transition-colors flex items-center gap-2"
            >
              <Play size={18} /> Start Again
            </button>
          )}
        </div>
      </div>

      {editable && (
        <div className="mb-6">
          <p className="text-sm text-inkSoft mb-2">Quick start</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => applyPreset(m)}
                className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${
                  durationSeconds === m * 60
                    ? "bg-ink text-paper border-ink"
                    : "border-line text-inkSoft hover:border-ink"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <form onSubmit={applyCustom} className="flex items-center gap-2">
            <label className="sr-only" htmlFor="custom-minutes">
              Custom duration in minutes
            </label>
            <input
              id="custom-minutes"
              type="number"
              min="1"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-accent"
            />
            <span className="text-sm text-inkSoft">minutes</span>
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-2 text-sm hover:border-ink transition-colors"
            >
              Set
            </button>
          </form>
        </div>
      )}

      <RoutineSessionSelect
        routines={durationRoutines}
        value={routineId}
        onChange={setRoutine}
        disabled={running}
        liveSeconds={elapsedForRoutine}
      />
    </div>
  );
}
