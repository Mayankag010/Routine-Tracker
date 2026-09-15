"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePomodoroEngine, SESSIONS_PER_CYCLE } from "@/lib/timer/usePomodoroEngine";
import { logTimerSession } from "@/lib/timer/sessions";
import { addDurationProgress } from "@/lib/routines";
import { getTarget } from "@/lib/routine-types";
import { toDateKey } from "@/lib/schedule";
import { formatClock } from "@/lib/timer/format";
import { RoutineSessionSelect } from "./RoutineSessionSelect";

export function PomodoroTimer({ durationRoutines }) {
  const { user } = useAuth();
  const [error, setError] = useState("");

  async function handleFocusComplete({ durationSeconds, startedAtIso, endedAtIso, routineId, routineName }) {
    if (!user) return;
    try {
      await logTimerSession(user.uid, {
        timerType: "pomodoro-focus",
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

  const {
    status,
    phase,
    focusMinutes,
    breakMinutes,
    sessionNumber,
    sessionsCompletedToday,
    remainingSeconds,
    routineId,
    setRoutine,
    setDurations,
    start,
    pause,
    skip,
    reset,
  } = usePomodoroEngine({ onFocusComplete: handleFocusComplete });

  const running = status === "running";
  const editable = status === "idle";
  const focusSecondsSoFar = phase === "focus" ? Math.max(0, focusMinutes * 60 - remainingSeconds) : 0;

  return (
    <div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</p>
      )}

      <div className="flex flex-col items-center py-8">
        <p className="text-xs uppercase tracking-widest text-inkSoft mb-2">
          {phase === "focus" ? "Focus" : "Short Break"}
        </p>
        <p
          className="font-display text-5xl md:text-7xl tabular-nums tracking-tight"
          aria-live="polite"
        >
          {formatClock(remainingSeconds)}
        </p>
        <p className="text-sm text-inkSoft mt-2">
          Session {sessionNumber} of {SESSIONS_PER_CYCLE}
        </p>

        <div className="flex items-center gap-3 mt-8">
          {status === "idle" && (
            <button
              onClick={start}
              aria-label="Start focus session"
              className="rounded-full bg-ink px-8 py-3 text-paper hover:brightness-110 transition-colors flex items-center gap-2"
            >
              <Play size={18} /> Start
            </button>
          )}
          {status === "running" && (
            <>
              <button
                onClick={pause}
                aria-label="Pause"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <Pause size={18} /> Pause
              </button>
              <button
                onClick={skip}
                aria-label={phase === "focus" ? "Skip to break" : "Skip to focus"}
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <SkipForward size={18} /> Skip
              </button>
              <button
                onClick={reset}
                aria-label="Reset"
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
                aria-label="Resume"
                className="rounded-full bg-ink px-6 py-3 text-paper hover:brightness-110 transition-colors flex items-center gap-2"
              >
                <Play size={18} /> Resume
              </button>
              <button
                onClick={skip}
                aria-label={phase === "focus" ? "Skip to break" : "Skip to focus"}
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <SkipForward size={18} /> Skip
              </button>
              <button
                onClick={reset}
                aria-label="Reset"
                className="rounded-full border border-line px-6 py-3 hover:border-ink transition-colors flex items-center gap-2"
              >
                <RotateCcw size={18} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {editable && (
        <div className="mb-6 flex gap-3">
          <label className="block flex-1">
            <span className="block text-sm text-inkSoft mb-1">Focus (minutes)</span>
            <input
              type="number"
              min="1"
              value={focusMinutes}
              onChange={(e) => setDurations(Math.max(1, Number(e.target.value) || 1), breakMinutes)}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
            />
          </label>
          <label className="block flex-1">
            <span className="block text-sm text-inkSoft mb-1">Short break (minutes)</span>
            <input
              type="number"
              min="1"
              value={breakMinutes}
              onChange={(e) => setDurations(focusMinutes, Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
            />
          </label>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-line bg-surface/40 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-inkSoft">Focus Sessions Completed</span>
        <span className="font-display text-xl">{sessionsCompletedToday}</span>
      </div>

      <RoutineSessionSelect
        routines={durationRoutines}
        value={routineId}
        onChange={setRoutine}
        disabled={running}
        liveSeconds={focusSecondsSoFar}
      />
    </div>
  );
}
