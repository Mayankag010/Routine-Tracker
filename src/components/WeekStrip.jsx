"use client";

import { addDays, toDateKey } from "@/lib/schedule";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeekStrip({ selectedKey, onSelect, summary }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)); // last 7 days, ending today

  return (
    <div className="flex justify-between gap-1 mb-8">
      {days.map((date) => {
        const key = toDateKey(date);
        const isSelected = key === selectedKey;
        const isToday = key === toDateKey(today);
        const stats = summary[key];

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl px-2.5 py-2.5 flex-1 transition-colors ${
              isSelected ? "bg-ink text-paper" : "hover:bg-paperDark"
            }`}
          >
            <span className={`text-xs ${isSelected ? "text-paper/70" : "text-inkSoft"}`}>
              {DAY_LETTERS[date.getDay()]}
            </span>
            <span className={`text-sm ${isToday && !isSelected ? "text-accent font-semibold" : ""}`}>
              {date.getDate()}
            </span>
            <CompletionDot stats={stats} inverted={isSelected} />
          </button>
        );
      })}
    </div>
  );
}

function CompletionDot({ stats, inverted }) {
  if (!stats || stats.scheduled === 0) {
    return <span className="h-1.5 w-1.5" />;
  }
  const complete = stats.done >= stats.scheduled;
  const partial = stats.done > 0 && !complete;

  return (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{
        backgroundColor: complete
          ? "rgb(var(--color-gold))"
          : partial
          ? inverted
            ? "#FBF7F0"
            : "rgb(var(--color-ink-soft))"
          : "transparent",
        border: !complete && !partial ? `1.5px solid ${inverted ? "#FBF7F0" : "rgb(var(--color-ink-soft))"}` : "none",
      }}
    />
  );
}
