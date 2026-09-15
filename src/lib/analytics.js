/**
 * Turn a { scheduled, done } day-stat into a percentage, or null when
 * there's nothing to calculate from (no habits scheduled that day).
 * Never returns NaN.
 */
export function percentFor(stats) {
  if (!stats || !stats.scheduled) return null;
  return Math.round((stats.done / stats.scheduled) * 100);
}

/**
 * Bucket a percentage (or null) into one of 6 heatmap intensity steps:
 * 0 = nothing scheduled / 0%, 1 = 1-25%, 2 = 26-50%, 3 = 51-75%,
 * 4 = 76-99%, 5 = 100%.
 */
export function intensityBucket(percent) {
  if (percent === null || percent === 0) return 0;
  if (percent >= 100) return 5;
  if (percent >= 76) return 4;
  if (percent >= 51) return 3;
  if (percent >= 26) return 2;
  return 1;
}

// Teal-toward-gold ramp so it reads as "this app's heatmap", not GitHub's.
export const INTENSITY_COLORS = [
  "#EFE9D8", // 0 — empty (slightly darker than paper so it's visible)
  "#CFE3DC", // 1
  "#9FC8BA",  // 2
  "#5FA890", // 3
  "#2C8F76", // 4
  "#E8B75D", // 5 — full completion gets the gold highlight
];

/** Average of an array of percentages, ignoring nulls. Returns null if none. */
export function averagePercent(percents) {
  const valid = percents.filter((p) => p !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, p) => sum + p, 0) / valid.length);
}
