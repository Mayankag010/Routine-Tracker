"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { RoutineRow } from "@/components/RoutineRow";
import { RoutineModal } from "@/components/RoutineModal";
import { StreakBanner } from "@/components/StreakBanner";
import { DailyNoteSection } from "@/components/DailyNoteSection";
import { TimerQuickCard } from "@/components/timer/TimerQuickCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { useAuth } from "@/lib/auth-context";
import { subscribeRoutines } from "@/lib/routines";
import { useCompletionSummary } from "@/lib/useCompletionSummary";
import { useRoutineDoneDates } from "@/lib/useRoutineDoneDates";
import { routineAppliesOnDate, toDateKey, addDays } from "@/lib/schedule";
import { overallCurrentStreak, currentStreak, bestStreak } from "@/lib/streaks";

const TODAY = new Date();
const TODAY_KEY = toDateKey(TODAY);
const TODAY_LABEL = TODAY.toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});
// How far back to look for streaks. A generous cap keeps the query cheap
// while covering realistic streak lengths.
const STREAK_LOOKBACK_KEY = toDateKey(addDays(TODAY, -120));

function DashboardContent() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState(null);
  const [editing, setEditing] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    return subscribeRoutines(user.uid, setRoutines);
  }, [user]);

  const summary = useCompletionSummary(routines, STREAK_LOOKBACK_KEY, TODAY_KEY);
  const overallStreak = overallCurrentStreak(summary, STREAK_LOOKBACK_KEY, TODAY_KEY);

  // Per-routine completion history, for the individual streak badge on
  // each row — one range query per routine (not per day), always
  // recalculated from real data so historical edits (e.g. from the
  // calendar/date-details drawer) are reflected automatically.
  const doneMap = useRoutineDoneDates(routines, STREAK_LOOKBACK_KEY, TODAY_KEY);

  const todaysRoutines = routines?.filter((r) => routineAppliesOnDate(r, TODAY));

  return (
    <AppShell>
      <div className="px-6 py-10 md:px-12 max-w-xl">
        <p className="text-inkSoft mb-1">{TODAY_LABEL}</p>
        <h1 className="font-display text-3xl mb-6">Today</h1>

        {routines && routines.length > 0 && <StreakBanner streak={overallStreak} />}

        {routines === null && <p className="text-inkSoft">Loading…</p>}

        {routines?.length === 0 && (
          <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
            <p className="text-inkSoft mb-4">
              You haven't added any routines yet.
            </p>
            <Link
              href="/routines"
              className="inline-block rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:brightness-110 transition-colors"
            >
              Add your first routine
            </Link>
          </div>
        )}

        {todaysRoutines?.length === 0 && routines?.length > 0 && (
          <p className="text-inkSoft">Nothing scheduled for today. Enjoy the day off.</p>
        )}

        {todaysRoutines?.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {todaysRoutines.map((routine) => {
              const done = doneMap[routine.id] || new Set();
              const streak = {
                current: currentStreak(routine, done, STREAK_LOOKBACK_KEY, TODAY_KEY),
                best: bestStreak(routine, done, STREAK_LOOKBACK_KEY, TODAY_KEY),
              };
              return (
                <RoutineRow
                  key={routine.id}
                  routine={routine}
                  dateKey={TODAY_KEY}
                  onEdit={setEditing}
                  streak={streak}
                />
              );
            })}
          </ul>
        )}

        {routines !== null && (
          <div className="mt-8">
            <TimerQuickCard />
          </div>
        )}

        {routines !== null && (
          <div className="mt-3">
            <WeatherWidget />
          </div>
        )}

        {routines !== null && (
          <div className="mt-6">
            <DailyNoteSection dateKey={TODAY_KEY} compact />
          </div>
        )}
      </div>

      {editing !== undefined && (
        <RoutineModal routine={editing} onClose={() => setEditing(undefined)} />
      )}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
