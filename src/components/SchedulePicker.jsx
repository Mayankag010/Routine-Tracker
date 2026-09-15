"use client";

import { DAY_LABELS } from "@/lib/schedule";

const TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
  { value: "custom", label: "Custom" },
];

export function SchedulePicker({ schedule, onChange }) {
  const type = schedule?.type || "daily";
  const days = schedule?.days || [];

  function setType(newType) {
    onChange({ type: newType, days: newType === "custom" ? days : [] });
  }

  function toggleDay(dayIndex) {
    const next = days.includes(dayIndex)
      ? days.filter((d) => d !== dayIndex)
      : [...days, dayIndex];
    onChange({ type: "custom", days: next });
  }

  return (
    <div>
      <span className="block text-sm text-inkSoft mb-2">Repeats</span>
      <div className="flex flex-wrap gap-2 mb-3">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
              type === t.value
                ? "bg-ink text-paper border-ink"
                : "border-line text-inkSoft hover:border-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === "custom" && (
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(index)}
              className={`h-9 w-9 rounded-full text-xs border transition-colors ${
                days.includes(index)
                  ? "bg-accent text-paper border-accent"
                  : "border-line text-inkSoft hover:border-ink"
              }`}
            >
              {label[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
