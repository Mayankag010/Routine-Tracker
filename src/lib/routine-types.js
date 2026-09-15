/**
 * Routine types.
 *
 * `done` for a given day is always decided at write time (see
 * setProgressValue in lib/routines.js) and stored on that day's completion
 * doc — never recomputed on the fly from the routine's *current* target.
 * That's what keeps historical days intact if a routine's target changes
 * later (Part 9 / Part 6 of the spec): editing the routine only changes
 * what future days compare against, past completion docs are untouched.
 */
export const ROUTINE_TYPES = [
  { value: "checkbox", label: "Checkbox", hint: "Simple done / not done" },
  { value: "count", label: "Count", hint: "e.g. 35 / 50 push-ups" },
  { value: "duration", label: "Duration", hint: "e.g. 1h 25m / 2h" },
  { value: "goal", label: "Goal", hint: "e.g. 20 / 30 pages" },
];

export function getRoutineType(routine) {
  const type = routine?.type;
  return ROUTINE_TYPES.some((t) => t.value === type) ? type : "checkbox";
}

export function isNumericType(type) {
  return type === "count" || type === "duration" || type === "goal";
}

export function defaultTargetForType(type) {
  switch (type) {
    case "duration":
      return 30; // minutes
    case "count":
      return 10;
    case "goal":
      return 1;
    default:
      return 1;
  }
}

export function defaultUnitForType(type) {
  switch (type) {
    case "count":
      return "reps";
    case "goal":
      return "units";
    default:
      return "";
  }
}

export function getTarget(routine) {
  const t = Number(routine?.target);
  return Number.isFinite(t) && t > 0 ? t : defaultTargetForType(getRoutineType(routine));
}

export function getUnit(routine) {
  const type = getRoutineType(routine);
  if (routine?.unit) return routine.unit;
  return defaultUnitForType(type);
}

/** Step size used by the +/- controls on the Today/Calendar checklists. */
export function stepForType(type) {
  return type === "duration" ? 5 : 1;
}

/** Progress percentage, capped at 100 — never shows more than "100%". */
export function progressPercent(value, target) {
  if (!target || target <= 0) return 0;
  const pct = ((Number(value) || 0) / target) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function formatMinutesClock(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${String(h).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function formatMinutesShort(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

/** "35 / 50 reps", "01:25 / 02:00", "20 / 30 minutes" — per-type display text. */
export function formatProgress(routine, value) {
  const type = getRoutineType(routine);
  const target = getTarget(routine);
  const val = Math.max(0, Number(value) || 0);

  if (type === "duration") {
    return `${formatMinutesClock(val)} / ${formatMinutesClock(target)}`;
  }
  const unit = getUnit(routine);
  return `${val} / ${target}${unit ? ` ${unit}` : ""}`;
}
