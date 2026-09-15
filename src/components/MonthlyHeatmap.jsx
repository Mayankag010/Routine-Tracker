"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { toDateKey, MONTH_LABELS } from "@/lib/schedule";
import { percentFor, intensityBucket, INTENSITY_COLORS } from "@/lib/analytics";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// JS getDay() is 0=Sun..6=Sat. Convert to a Monday-start index (0=Mon..6=Sun).
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function MonthlyHeatmap({ year, month, onNavigate, summary, onSelectDate, noteDates }) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = mondayIndex(firstOfMonth);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div className="rounded-xl border border-line bg-surface/40 px-5 py-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="font-display text-xl">Monthly Activity</p>
          <p className="text-sm text-inkSoft">Your habit consistency this month</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(-1)}
            aria-label="Previous month"
            className="rounded-full p-1.5 hover:bg-paperDark"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm w-28 text-center">
            {MONTH_LABELS[month]} {year}
          </span>
          <button
            onClick={() => onNavigate(1)}
            aria-label="Next month"
            disabled={isCurrentMonth}
            className="rounded-full p-1.5 hover:bg-paperDark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mt-5 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs text-inkSoft">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;

          const date = new Date(year, month, day);
          const key = toDateKey(date);
          const isFuture = key > todayKey;
          const stats = isFuture ? null : summary[key];
          const percent = percentFor(stats);
          const bucket = isFuture ? -1 : intensityBucket(percent);
          const isToday = key === todayKey;
          const hasNote = !isFuture && noteDates?.has(key);

          return (
            <div key={key} className="group relative">
              <button
                type="button"
                onClick={() => !isFuture && onSelectDate?.(key)}
                disabled={isFuture}
                aria-label={
                  isFuture
                    ? undefined
                    : `${date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}, ${
                        stats && stats.scheduled > 0
                          ? `${percent}% completed`
                          : "nothing scheduled"
                      }`
                }
                className={`w-full aspect-square rounded-md flex items-center justify-center text-[11px] transition-transform duration-150 ${
                  isFuture ? "" : "cursor-pointer hover:scale-110"
                } ${isToday ? "ring-2 ring-accent" : ""}`}
                style={{
                  backgroundColor: isFuture ? "transparent" : INTENSITY_COLORS[bucket],
                  border: isFuture ? "1px dashed rgb(var(--color-line))" : "none",
                  color: bucket >= 4 ? "#FBF7F0" : "#23282B",
                }}
              >
                {day}
              </button>

              {hasNote && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-ink ring-1 ring-paper"
                />
              )}

              {!isFuture && (
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-paper shadow-lg">
                  <p className="font-medium">
                    {date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                  </p>
                  {stats && stats.scheduled > 0 ? (
                    <>
                      <p>
                        {stats.done} of {stats.scheduled} habits completed
                      </p>
                      <p>{percent}% completed</p>
                    </>
                  ) : (
                    <p>Nothing scheduled</p>
                  )}
                  {hasNote && <p>📝 Note added</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-4 text-xs text-inkSoft">
        <span>Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <span key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
