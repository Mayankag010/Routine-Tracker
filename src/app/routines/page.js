"use client";

import { useEffect, useState } from "react";
import { Plus, Flame, Trophy } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { RoutineModal } from "@/components/RoutineModal";
import { useAuth } from "@/lib/auth-context";
import { subscribeRoutines } from "@/lib/routines";
import { useRoutineDoneDates } from "@/lib/useRoutineDoneDates";
import { scheduleLabel, toDateKey, addDays } from "@/lib/schedule";
import { currentStreak, bestStreak } from "@/lib/streaks";
import { getTarget, getUnit, formatMinutesShort } from "@/lib/routine-types";

function routineTypeLabel(routine) {
  const target = getTarget(routine);
  if (routine.type === "duration") return `Target ${formatMinutesShort(target)}`;
  const unit = getUnit(routine);
  return `Target ${target}${unit ? ` ${unit}` : ""}`;
}

const TODAY_KEY = toDateKey(new Date());
const STREAK_LOOKBACK_KEY = toDateKey(addDays(new Date(), -120));

function RoutinesContent() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState(null);
  const [modalRoutine, setModalRoutine] = useState(undefined); // undefined = closed, null = new, object = edit

  useEffect(() => {
    if (!user) return;
    return subscribeRoutines(user.uid, setRoutines);
  }, [user]);

  const doneMap = useRoutineDoneDates(routines, STREAK_LOOKBACK_KEY, TODAY_KEY);

  return (
    <AppShell>
      <div className="px-6 py-10 md:px-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">Your routines</h1>
          <button
            onClick={() => setModalRoutine(null)}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper hover:brightness-110 transition-colors"
          >
            <Plus size={16} />
            New routine
          </button>
        </div>

        {routines === null && <p className="text-inkSoft">Loading…</p>}

        {routines?.length === 0 && (
          <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
            <p className="text-inkSoft mb-4">
              No routines yet. Add the first thing you want to keep track of.
            </p>
            <button
              onClick={() => setModalRoutine(null)}
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:brightness-110 transition-colors"
            >
              Add a routine
            </button>
          </div>
        )}

        <ul className="divide-y divide-line border-t border-line">
          {routines?.map((routine) => {
            const done = doneMap[routine.id] || new Set();
            const current = currentStreak(routine, done, STREAK_LOOKBACK_KEY, TODAY_KEY);
            const best = bestStreak(routine, done, STREAK_LOOKBACK_KEY, TODAY_KEY);

            return (
              <li key={routine.id}>
                <button
                  onClick={() => setModalRoutine(routine)}
                  className="w-full flex items-center gap-4 py-4 text-left hover:bg-paperDark/40 transition-colors px-2 -mx-2 rounded-lg"
                >
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: routine.color }}
                  />
                  <span className="flex-1">
                    <span className="block">
                      {routine.icon ? `${routine.icon} ` : ""}
                      {routine.name}
                    </span>
                    <span className="block text-sm text-inkSoft">
                      {scheduleLabel(routine.schedule)}
                      {routine.type && routine.type !== "checkbox" && (
                        <> · {routineTypeLabel(routine)}</>
                      )}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-sm shrink-0">
                    <span className="flex items-center gap-1">
                      <Flame size={14} className={current > 0 ? "text-gold" : "text-inkSoft"} />
                      {current}
                    </span>
                    {best > 0 && (
                      <span className="flex items-center gap-1 text-inkSoft">
                        <Trophy size={14} />
                        {best}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {modalRoutine !== undefined && (
        <RoutineModal
          routine={modalRoutine}
          onClose={() => setModalRoutine(undefined)}
        />
      )}
    </AppShell>
  );
}

export default function RoutinesPage() {
  return (
    <RequireAuth>
      <RoutinesContent />
    </RequireAuth>
  );
}
