"use client";

import { useEffect, useRef, useState } from "react";
import { loadTimerState, saveTimerState } from "./storage";

const KEY = "stopwatch";
const TICK_MS = 250;
// Below this, a reset doesn't produce a session worth remembering — avoids
// littering "Recent Sessions" with accidental start/stop taps.
const MIN_MEANINGFUL_SECONDS = 10;

const IDLE_STATE = {
  status: "idle", // idle | running | paused
  elapsedSeconds: 0,
  startedAtMs: null,
  routineId: null,
  routineName: "",
  sessionStartIso: null,
};

function computeElapsed(state) {
  if (state.status === "running" && state.startedAtMs) {
    return state.elapsedSeconds + (Date.now() - state.startedAtMs) / 1000;
  }
  return state.elapsedSeconds;
}

/**
 * `onStop` fires when Reset is pressed on a run that accumulated at least
 * MIN_MEANINGFUL_SECONDS — the stopwatch has no natural "completion", so
 * Reset is the only point at which there's a finished session to log.
 */
export function useStopwatchEngine({ onStop } = {}) {
  const [state, setState] = useState(IDLE_STATE);
  const [, forceTick] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    const saved = loadTimerState(KEY);
    if (saved) setState(saved);
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (loadedRef.current) saveTimerState(KEY, state);
  }, [state]);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => forceTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  const elapsed = computeElapsed(state);

  function setRoutine(routineId, routineName) {
    if (state.status === "running") return;
    setState((s) => ({ ...s, routineId, routineName }));
  }

  function start() {
    if (state.status === "idle") {
      setState((s) => ({
        ...s,
        status: "running",
        elapsedSeconds: 0,
        startedAtMs: Date.now(),
        sessionStartIso: new Date().toISOString(),
      }));
    } else if (state.status === "paused") {
      setState((s) => ({ ...s, status: "running", startedAtMs: Date.now() }));
    }
  }

  function pause() {
    if (state.status !== "running") return;
    setState((s) => ({ ...s, status: "paused", elapsedSeconds: computeElapsed(s), startedAtMs: null }));
  }

  function reset() {
    const finalElapsed = computeElapsed(state);
    if (state.status !== "idle" && finalElapsed >= MIN_MEANINGFUL_SECONDS) {
      onStop?.({
        durationSeconds: finalElapsed,
        startedAtIso: state.sessionStartIso,
        endedAtIso: new Date().toISOString(),
        routineId: state.routineId,
        routineName: state.routineName,
      });
    }
    setState((s) => ({ ...IDLE_STATE, routineId: s.routineId, routineName: s.routineName }));
  }

  return {
    status: state.status,
    elapsedSeconds: elapsed,
    routineId: state.routineId,
    routineName: state.routineName,
    setRoutine,
    start,
    pause,
    reset,
  };
}
