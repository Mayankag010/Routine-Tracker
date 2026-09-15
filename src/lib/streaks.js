import { eachDateKeyInRange, fromDateKey, routineAppliesOnDate } from "@/lib/schedule";

/**
 * Current streak: counting backward from today, how many consecutive
 * *scheduled* days in a row were completed. A day the routine wasn't
 * scheduled on doesn't break the streak — it's just skipped.
 */
export function currentStreak(routine, doneDateKeys, startKey, todayKey) {
  const days = eachDateKeyInRange(startKey, todayKey);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const key = days[i];
    const date = fromDateKey(key);
    if (!routineAppliesOnDate(routine, date)) continue;
    if (doneDateKeys.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Longest run of consecutive completed scheduled-days within [startKey, endKey]. */
export function bestStreak(routine, doneDateKeys, startKey, endKey) {
  const days = eachDateKeyInRange(startKey, endKey);
  let best = 0;
  let running = 0;
  for (const key of days) {
    const date = fromDateKey(key);
    if (!routineAppliesOnDate(routine, date)) continue;
    if (doneDateKeys.has(key)) {
      running++;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }
  return best;
}

/**
 * "Overall" streak across ALL routines combined — the kind of streak most
 * habit apps show front and center. A day counts toward the streak only if
 * every routine scheduled that day was completed (100%). Days with nothing
 * scheduled are skipped, not counted as breaks.
 *
 * Takes the day-level { scheduled, done } summary map (from
 * useCompletionSummary), not per-routine data.
 */
export function overallCurrentStreak(summary, startKey, todayKey) {
  const days = eachDateKeyInRange(startKey, todayKey);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const stats = summary[days[i]];
    if (!stats || stats.scheduled === 0) continue; // nothing scheduled, skip
    if (stats.done >= stats.scheduled) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Longest run of fully-completed days within [startKey, endKey]. */
export function overallBestStreak(summary, startKey, endKey) {
  const days = eachDateKeyInRange(startKey, endKey);
  let best = 0;
  let running = 0;
  for (const key of days) {
    const stats = summary[key];
    if (!stats || stats.scheduled === 0) continue;
    if (stats.done >= stats.scheduled) {
      running++;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }
  return best;
}
