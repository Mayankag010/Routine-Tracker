"use client";

import { useEffect, useRef, useState } from "react";
import { loadTimerState, saveTimerState } from "./storage";
import { toDateKey } from "@/lib/schedule";

const KEY = "pomodoro";
const TICK_MS = 250;
export const SESSIONS_PER_CYCLE = 4;
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

function idleState() {
  return {
    status: "idle", // idle | running | paused
    phase: "focus", // focus | break
    focusMinutes: DEFAULT_FOCUS_MINUTES,
    breakMinutes: DEFAULT_BREAK_MINUTES,
    sessionNumber: 1,
    remainingSeconds: DEFAULT_FOCUS_MINUTES * 60,
    startedAtMs: null,
    routineId: null,
    routineName: "",
    sessionStartIso: null,
    completedToday: { date: toDateKey(new Date()), count: 0 },
  };
}

function computeRemaining(state) {
  if (state.status === "running" && state.startedAtMs) {
    const elapsed = (Date.now() - state.startedAtMs) / 1000;
    return Math.max(0, state.remainingSeconds - elapsed);
  }
  return Math.max(0, state.remainingSeconds);
}

function phaseSeconds(state, phase) {
  return (phase === "focus" ? state.focusMinutes : state.breakMinutes) * 60;
}

/**
 * `onFocusComplete` fires each time a Focus interval finishes naturally
 * (not on Skip), so the caller can log a session and, if a duration
 * routine is attached, add the focus minutes to its daily progress.
 */
export function usePomodoroEngine({ onFocusComplete } = {}) {
  const [state, setState] = useState(idleState);
  const [, forceTick] = useState(0);
  const loadedRef = useRef(false);
  const transitioningRef = useRef(false);

  useEffect(() => {
    const saved = loadTimerState(KEY);
    if (saved) {
      const todayKey = toDateKey(new Date());
      const completedToday =
        saved.completedToday?.date === todayKey ? saved.completedToday : { date: todayKey, count: 0 };
      const restored = { ...idleState(), ...saved, completedToday };

      // If the interval already finished while we were away (tab closed,
      // backgrounded, etc.), don't silently re-arm a fresh interval with
      // today's timestamp — that would discard however much time actually
      // passed and quietly count as if the user had just finished. Land in
      // a safe paused-at-zero state instead, matching the away-completion
      // handling in useCountdownEngine.js. This intentionally does NOT
      // fire onFocusComplete or bump completedToday — those only happen
      // for a transition witnessed live, same rationale as the countdown
      // engine's "don't re-fire onComplete" comment below.
      if (restored.status === "running" && computeRemaining(restored) <= 0) {
        setState({ ...restored, status: "paused", remainingSeconds: 0, startedAtMs: null });
      } else {
        setState(restored);
      }
    }
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

  const remaining = computeRemaining(state);

  // Auto-advance focus -> break -> focus when the running interval hits zero.
  useEffect(() => {
    if (state.status !== "running" || remaining > 0 || transitioningRef.current) return;
    transitioningRef.current = true;

    if (state.phase === "focus") {
      const endedAtIso = new Date().toISOString();
      onFocusComplete?.({
        durationSeconds: state.focusMinutes * 60,
        startedAtIso: state.sessionStartIso,
        endedAtIso,
        routineId: state.routineId,
        routineName: state.routineName,
      });
      setState((s) => {
        const todayKey = toDateKey(new Date());
        const prevCount = s.completedToday?.date === todayKey ? s.completedToday.count : 0;
        return {
          ...s,
          phase: "break",
          remainingSeconds: phaseSeconds(s, "break"),
          startedAtMs: Date.now(),
          sessionStartIso: new Date().toISOString(),
          completedToday: { date: todayKey, count: prevCount + 1 },
        };
      });
    } else {
      setState((s) => ({
        ...s,
        phase: "focus",
        sessionNumber: (s.sessionNumber % SESSIONS_PER_CYCLE) + 1,
        remainingSeconds: phaseSeconds(s, "focus"),
        startedAtMs: Date.now(),
        sessionStartIso: new Date().toISOString(),
      }));
    }
    // Let the next tick's remaining value settle before allowing another transition.
    setTimeout(() => {
      transitioningRef.current = false;
    }, TICK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, state.status, state.phase]);

  function setRoutine(routineId, routineName) {
    if (state.status === "running") return;
    setState((s) => ({ ...s, routineId, routineName }));
  }

  function setDurations(focusMinutes, breakMinutes) {
    if (state.status !== "idle") return;
    setState((s) => ({
      ...s,
      focusMinutes,
      breakMinutes,
      remainingSeconds: (s.phase === "focus" ? focusMinutes : breakMinutes) * 60,
    }));
  }

  function start() {
    if (state.status === "idle") {
      setState((s) => ({
        ...s,
        status: "running",
        remainingSeconds: phaseSeconds(s, s.phase),
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

  // Skip abandons the current interval without logging it — distinct from
  // a natural completion, which is what actually counts toward "Focus
  // Sessions Completed" and gets saved to session history.
  function skip() {
    setState((s) => {
      if (s.phase === "focus") {
        return {
          ...s,
          phase: "break",
          remainingSeconds: phaseSeconds(s, "break"),
          startedAtMs: s.status === "running" ? Date.now() : null,
          sessionStartIso: new Date().toISOString(),
        };
      }
      return {
        ...s,
        phase: "focus",
        sessionNumber: (s.sessionNumber % SESSIONS_PER_CYCLE) + 1,
        remainingSeconds: phaseSeconds(s, "focus"),
        startedAtMs: s.status === "running" ? Date.now() : null,
        sessionStartIso: new Date().toISOString(),
      };
    });
  }

  function reset() {
    setState((s) => ({
      ...idleState(),
      focusMinutes: s.focusMinutes,
      breakMinutes: s.breakMinutes,
      routineId: s.routineId,
      routineName: s.routineName,
      completedToday: s.completedToday,
    }));
  }

  // Derived fresh on every read (not just on mount / on the next focus
  // completion) so the counter actually shows 0 right after local
  // midnight even if the timer sits idle and no new session completes to
  // trigger the stored value's own date check.
  const todayKeyNow = toDateKey(new Date());
  const sessionsCompletedToday =
    state.completedToday?.date === todayKeyNow ? state.completedToday.count : 0;

  return {
    status: state.status,
    phase: state.phase,
    focusMinutes: state.focusMinutes,
    breakMinutes: state.breakMinutes,
    sessionNumber: state.sessionNumber,
    sessionsCompletedToday,
    remainingSeconds: remaining,
    routineId: state.routineId,
    routineName: state.routineName,
    setRoutine,
    setDurations,
    start,
    pause,
    skip,
    reset,
  };
}
