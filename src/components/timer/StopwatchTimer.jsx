"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useStopwatchEngine } from "@/lib/timer/useStopwatchEngine";
import { logTimerSession } from "@/lib/timer/sessions";
import { addDurationProgress } from "@/lib/routines";
import { getTarget } from "@/lib/routine-types";
import { toDateKey } from "@/lib/schedule";
import { formatClockLong } from "@/lib/timer/format";
import { RoutineSessionSelect } from "./RoutineSessionSelect";

export function StopwatchTimer({ durationRoutines }) {
  const { user } = useAuth();
  const [error, setError] = useState("");

  async function handleStop({ durationSeconds, startedAtIso, endedAtIso, routineId, routineName }) {
    if (!user) return;
    try {
      await logTimerSession(user.uid, {
        timerType: "stopwatch",
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

  const { status, elapsedSeconds, routineId, start, pause, reset, setRoutine } = useStopwatchEngine({
    onStop: handleStop,
  });

  const running = status === "running";

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
          {formatClockLong(elapsedSeconds)}
        </p>

        <div className="flex items-center gap-3 mt-8">
          {status === "idle" && (
            <button
              onClick={start}
              aria-label="Start stopwatch"
              className="rounded-full bg-ink px-8 py-3 text-paper hover:brightness-110 transition-colors flex items-center gap-2"
            >
              <Play size={18} /> Start
            </button>
          )}
          {status === "running" && (
            <>
              <button
                onClick={pause}
                aria-label="Pause stopwatch"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <Pause size={18} /> Pause
              </button>
              <button
                onClick={reset}
                aria-label="Reset stopwatch"
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
                aria-label="Resume stopwatch"
                className="rounded-full bg-ink px-6 py-3 text-paper hover:brightness-110 transition-colors flex items-center gap-2"
              >
                <Play size={18} /> Resume
              </button>
              <button
                onClick={reset}
                aria-label="Reset stopwatch"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <RotateCcw size={18} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      <RoutineSessionSelect
        routines={durationRoutines}
        value={routineId}
        onChange={setRoutine}
        disabled={running}
        liveSeconds={elapsedSeconds}
      />
    </div>
  );
}
