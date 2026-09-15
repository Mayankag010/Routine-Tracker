function pad(n) {
  return String(Math.floor(n)).padStart(2, "0");
}

/** 90 -> "01:30" (mm:ss), or "01:30:00" (hh:mm:ss) once an hour is involved. */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

/** Always hh:mm:ss — used for the stopwatch, which spec calls for as 00:00:00. */
export function formatClockLong(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** 5400 -> "1h 30m", 300 -> "5m" — for session-history and stat display. */
export function formatDurationShort(totalSeconds) {
  const mins = Math.round(totalSeconds / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
