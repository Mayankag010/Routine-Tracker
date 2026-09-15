"use client";

import { Flame } from "lucide-react";

export function StreakBanner({ streak }) {
  const hasStreak = streak > 0;

  return (
    <div
      className={`rounded-xl px-5 py-4 mb-8 flex items-center gap-4 ${
        hasStreak ? "bg-ink text-paper" : "border border-dashed border-line text-inkSoft"
      }`}
    >
      <Flame
        size={28}
        className={hasStreak ? "text-gold" : "text-inkSoft"}
        fill={hasStreak ? "currentColor" : "none"}
      />
      <div>
        <p className={`font-display text-2xl ${hasStreak ? "text-paper" : "text-ink"}`}>
          {hasStreak ? `${streak} day${streak === 1 ? "" : "s"} streak` : "No streak yet"}
        </p>
        <p className={`text-sm ${hasStreak ? "text-paper/70" : "text-inkSoft"}`}>
          {hasStreak
            ? "Every scheduled routine completed, every day."
            : "Complete everything scheduled today to start one."}
        </p>
      </div>
    </div>
  );
}
