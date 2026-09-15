"use client";

import { RoutineRow } from "@/components/RoutineRow";
import { routineAppliesOnDate, toDateKey } from "@/lib/schedule";

export function DayChecklist({ date, routines, onEditRoutine }) {
  const dateKey = toDateKey(date);
  const active = routines.filter((r) => routineAppliesOnDate(r, date));

  if (active.length === 0) {
    return <p className="text-inkSoft py-4">Nothing was scheduled this day.</p>;
  }

  return (
    <ul className="divide-y divide-line border-t border-line">
      {active.map((routine) => (
        <RoutineRow
          key={routine.id}
          routine={routine}
          dateKey={dateKey}
          onEdit={onEditRoutine}
        />
      ))}
    </ul>
  );
}
