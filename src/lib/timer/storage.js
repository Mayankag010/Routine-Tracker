/**
 * Timer state persistence.
 *
 * Each engine (countdown/stopwatch/pomodoro) is a self-contained slice of
 * localStorage, not Firestore — we never want to write a timer tick to the
 * database (see lib/timer/sessions.js for what *does* get saved remotely).
 * Values are plain JSON; every read/write is wrapped so a full or disabled
 * localStorage (private browsing, quota) degrades to "timer just won't
 * survive a refresh" instead of throwing.
 */

const PREFIX = "routine-tracker:timer:";

export function loadTimerState(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTimerState(key, state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(state));
  } catch {
    // Ignore — timer still works in-memory for this session.
  }
}

export function clearTimerState(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore.
  }
}
