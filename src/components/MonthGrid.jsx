"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { toDateKey, MONTH_LABELS } from "@/lib/schedule";

export function MonthGrid({ year, month, selectedKey, onSelect, onNavigate, summary, noteDates }) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateKey(new Date());

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">
          {MONTH_LABELS[month]} {year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => onNavigate(-1)}
            aria-label="Previous month"
            className="rounded-full p-1.5 hover:bg-paperDark"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => onNavigate(1)}
            aria-label="Next month"
            className="rounded-full p-1.5 hover:bg-paperDark"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-xs text-inkSoft py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const date = new Date(year, month, day);
          const key = toDateKey(date);
          const stats = summary[key];
          const isSelected = key === selectedKey;
          const isToday = key === today;
          const isFuture = key > today;

          const complete = stats && stats.scheduled > 0 && stats.done >= stats.scheduled;
          const partial = stats && stats.done > 0 && !complete;
          const hasNote = noteDates?.has(key);

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              disabled={isFuture}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-colors ${
                isSelected
                  ? "bg-ink text-paper"
                  : isFuture
                  ? "text-inkSoft/40 cursor-default"
                  : "hover:bg-paperDark"
              } ${isToday && !isSelected ? "ring-1 ring-accent" : ""}`}
            >
              {hasNote && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1 right-1 h-1 w-1 rounded-full ${
                    isSelected ? "bg-paper/70" : "bg-accent/70"
                  }`}
                />
              )}
              {day}
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: complete
                    ? "rgb(var(--color-gold))"
                    : partial
                    ? isSelected
                      ? "#FBF7F0"
                      : "rgb(var(--color-ink-soft))"
                    : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
