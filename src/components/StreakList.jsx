"use client";

import { Flame } from "lucide-react";
import { currentStreak, bestStreak } from "@/lib/streaks";

export function StreakList({ routines, doneMap, startKey, endKey, todayKey }) {
  return (
    <ul className="divide-y divide-line border-t border-line">
      {routines.map((routine) => {
        const done = doneMap[routine.id] || new Set();
        const current = currentStreak(routine, done, startKey, todayKey);
        const best = bestStreak(routine, done, startKey, endKey);

        return (
          <li key={routine.id} className="flex items-center gap-4 py-4">
            <span
              className="h-3.5 w-3.5 rounded-full shrink-0"
              style={{ backgroundColor: routine.color }}
            />
            <span className="flex-1">{routine.name}</span>
            <span className="flex items-center gap-1.5 text-sm">
              {current > 0 && <Flame size={15} className="text-gold" />}
              <span className={current > 0 ? "text-ink" : "text-inkSoft"}>
                {current} day{current === 1 ? "" : "s"}
              </span>
            </span>
            <span className="text-sm text-inkSoft w-20 text-right">
              best {best}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
