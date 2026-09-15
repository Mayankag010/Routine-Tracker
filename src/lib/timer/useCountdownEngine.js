"use client";

import { useEffect, useRef, useState } from "react";
import { loadTimerState, saveTimerState } from "./storage";

const KEY = "countdown";
const TICK_MS = 250;
const DEFAULT_SECONDS = 25 * 60; // matches the 25-min preset, a reasonable first-load default

const IDLE_STATE = {
  status: "idle", // idle | running | paused | done
  durationSeconds: DEFAULT_SECONDS,
  remainingSeconds: DEFAULT_SECONDS,
  startedAtMs: null,
  routineId: null,
  routineName: "",
  sessionStartIso: null,
};

// The only source of truth for "how much time is left" is wall-clock time,
// never a decrementing counter — this is what keeps the timer correct
// after a slow tab, a backgrounded browser, or a full page refresh.
function computeRemaining(state) {
  if (state.status === "running" && state.startedAtMs) {
    const elapsed = (Date.now() - state.startedAtMs) / 1000;
    return Math.max(0, state.remainingSeconds - elapsed);
  }
  return Math.max(0, state.remainingSeconds);
}

/**
 * `onComplete` fires exactly once per run when the countdown reaches zero,
 * with enough detail for the caller to log a session (lib/timer/sessions.js)
 * and, if a duration routine is attached, add to its daily progress.
 */
export function useCountdownEngine({ onComplete } = {}) {
  const [state, setState] = useState(IDLE_STATE);
  const [, forceTick] = useState(0);
  const loadedRef = useRef(false);
  const completedRef = useRef(false);

  // Restore from localStorage on mount, recalculating remaining time from
  // timestamps rather than trusting the stored number at face value —
  // covers the "refreshed while running" case correctly.
  useEffect(() => {
    const saved = loadTimerState(KEY);
    if (saved) {
      const remaining = computeRemaining(saved);
      if (saved.status === "running" && remaining <= 0) {
        completedRef.current = true; // already finished while we were away; don't re-fire onComplete
        setState({ ...IDLE_STATE, durationSeconds: saved.durationSeconds, remainingSeconds: 0, status: "done" });
      } else if (saved.status === "running") {
        setState(saved);
      } else {
        setState({ ...saved, remainingSeconds: remaining });
      }
    }
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (loadedRef.current) saveTimerState(KEY, state);
  }, [state]);

  // UI tick while running — this only forces a re-render; the displayed
  // value always comes from computeRemaining() at render time.
  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => forceTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  const remaining = computeRemaining(state);

  useEffect(() => {
    if (state.status === "running" && remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      const endedAtIso = new Date().toISOString();
      const completed = {
        durationSeconds: state.durationSeconds,
        startedAtIso: state.sessionStartIso,
        endedAtIso,
        routineId: state.routineId,
        routineName: state.routineName,
      };
      setState((s) => ({ ...s, status: "done", remainingSeconds: 0, startedAtMs: null }));
      onComplete?.(completed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, state.status]);

  function setDuration(seconds) {
    if (state.status !== "idle" && state.status !== "done") return;
    setState({ ...IDLE_STATE, durationSeconds: seconds, remainingSeconds: seconds, routineId: state.routineId, routineName: state.routineName });
  }

  function setRoutine(routineId, routineName) {
    if (state.status === "running") return;
    setState((s) => ({ ...s, routineId, routineName }));
  }

  function start() {
    if (state.durationSeconds <= 0) return;
    completedRef.current = false;
    if (state.status === "idle" || state.status === "done") {
      setState((s) => ({
        ...s,
        status: "running",
        remainingSeconds: s.durationSeconds,
        startedAtMs: Date.now(),
        sessionStartIso: new Date().toISOString(),
      }));
    } else if (state.status === "paused") {
      setState((s) => ({ ...s, status: "running", startedAtMs: Date.now() }));
    }
  }

  function pause() {
    if (state.status !== "running") return;
    setState((s) => ({ ...s, status: "paused", remainingSeconds: computeRemaining(s), startedAtMs: null }));
  }

  function reset() {
    completedRef.current = false;
    setState((s) => ({
      ...IDLE_STATE,
      durationSeconds: s.durationSeconds,
      remainingSeconds: s.durationSeconds,
      routineId: s.routineId,
      routineName: s.routineName,
    }));
  }

  return {
    status: state.status,
    durationSeconds: state.durationSeconds,
    remainingSeconds: remaining,
    routineId: state.routineId,
    routineName: state.routineName,
    setDuration,
    setRoutine,
    start,
    pause,
    reset,
  };
}
