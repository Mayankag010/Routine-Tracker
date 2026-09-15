export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

export function eachDateKeyInRange(startKey, endKey) {
  const start = fromDateKey(startKey);
  const end = fromDateKey(endKey);
  const keys = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    keys.push(toDateKey(d));
  }
  return keys;
}

export function isRoutineActiveOnDate(routine, date) {
  const day = date.getDay(); // 0 = Sunday ... 6 = Saturday
  const schedule = routine.schedule || { type: "daily" };

  switch (schedule.type) {
    case "weekdays":
      return day >= 1 && day <= 5;
    case "weekends":
      return day === 0 || day === 6;
    case "custom":
      return (schedule.days || []).includes(day);
    case "daily":
    default:
      return true;
  }
}

/**
 * Same as isRoutineActiveOnDate, but also makes sure the routine actually
 * existed yet on that date — so a habit added today doesn't retroactively
 * appear as "scheduled" (and therefore "missed") on days before it existed.
 */
export function routineAppliesOnDate(routine, date) {
  if (!isRoutineActiveOnDate(routine, date)) return false;
  const createdAt = routine.createdAt;
  if (createdAt && typeof createdAt.toDate === "function") {
    const createdKey = toDateKey(createdAt.toDate());
    if (toDateKey(date) < createdKey) return false;
  }
  return true;
}

export function scheduleLabel(schedule) {
  if (!schedule) return "Daily";
  switch (schedule.type) {
    case "weekdays":
      return "Weekdays";
    case "weekends":
      return "Weekends";
    case "custom":
      return (schedule.days || [])
        .slice()
        .sort((a, b) => a - b)
        .map((d) => DAY_LABELS[d])
        .join(", ") || "No days selected";
    case "daily":
    default:
      return "Every day";
  }
}
