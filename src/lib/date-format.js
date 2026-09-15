/** Formats a Date as either DD/MM/YYYY or MM/DD/YYYY per the user's
 * Routine Preferences > Date format setting. */
export function formatDatePref(date, dateFormat = "DD/MM/YYYY") {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return dateFormat === "MM/DD/YYYY" ? `${mm}/${dd}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
}

/** Sunday-first or Monday-first week, per Routine Preferences > Week starts on. */
export function orderedWeekdayIndexes(weekStart = "monday") {
  return weekStart === "sunday" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
}
