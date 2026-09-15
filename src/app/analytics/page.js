"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { StreakList } from "@/components/StreakList";
import { StatCard } from "@/components/StatCard";
import { TodayProgress } from "@/components/TodayProgress";
import { WeeklyBarChart } from "@/components/WeeklyBarChart";
import { MonthlyHeatmap } from "@/components/MonthlyHeatmap";
import { DateDetailsDrawer } from "@/components/DateDetailsDrawer";
import { FocusTimeStat } from "@/components/timer/FocusTimeStat";
import { useAuth } from "@/lib/auth-context";
import { subscribeRoutines } from "@/lib/routines";
import { useCompletionSummary } from "@/lib/useCompletionSummary";
import { useRoutineDoneDates } from "@/lib/useRoutineDoneDates";
import { useNoteDatesInRange } from "@/lib/useNoteDatesInRange";
import { toDateKey, addDays } from "@/lib/schedule";
import { percentFor, averagePercent } from "@/lib/analytics";
import { overallCurrentStreak } from "@/lib/streaks";

const TODAY = new Date();
const TODAY_KEY = toDateKey(TODAY);

function AnalyticsContent() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState(null);
  const [viewDate, setViewDate] = useState(TODAY);
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  useEffect(() => {
    if (!user) return;
    return subscribeRoutines(user.uid, setRoutines);
  }, [user]);

  // "Today", "Weekly performance", and the summary stat cards are always
  // pinned to the real current period (not affected by heatmap navigation).
  // One combined range covers all three, so it's one set of subscriptions.
  const currentMonthStart = useMemo(
    () => toDateKey(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)),
    []
  );
  const sevenDaysAgoKey = useMemo(() => toDateKey(addDays(TODAY, -6)), []);
  // 120-day lookback covers realistic streak lengths without extra queries —
  // the same range already serves today/weekly/monthly stats.
  const streakLookbackKey = useMemo(() => toDateKey(addDays(TODAY, -120)), []);
  const statsRangeStart = [sevenDaysAgoKey, currentMonthStart, streakLookbackKey].sort()[0];
  const statsSummary = useCompletionSummary(routines, statsRangeStart, TODAY_KEY);
  const doneMap = useRoutineDoneDates(routines, statsRangeStart, TODAY_KEY);
  const currentStreak = useMemo(
    () => overallCurrentStreak(statsSummary, statsRangeStart, TODAY_KEY),
    [statsSummary, statsRangeStart]
  );

  // The heatmap can navigate to past months independently.
  const heatYear = viewDate.getFullYear();
  const heatMonth = viewDate.getMonth();
  const heatRangeStart = useMemo(
    () => toDateKey(new Date(heatYear, heatMonth, 1)),
    [heatYear, heatMonth]
  );
  const heatRangeEnd = useMemo(() => {
    const monthEnd = toDateKey(new Date(heatYear, heatMonth + 1, 0));
    return monthEnd > TODAY_KEY ? TODAY_KEY : monthEnd;
  }, [heatYear, heatMonth]);
  const heatmapSummary = useCompletionSummary(routines, heatRangeStart, heatRangeEnd);
  const heatmapNoteDates = useNoteDatesInRange(user?.uid, heatRangeStart, heatRangeEnd);
  const monthNoteDates = useNoteDatesInRange(user?.uid, currentMonthStart, TODAY_KEY);

  function navigateMonth(delta) {
    const next = new Date(heatYear, heatMonth + delta, 1);
    if (next > TODAY) return; // never allow navigating into the future
    setViewDate(next);
  }

  // --- Derived stats, all guarded against empty/edge cases ---
  const todayStats = statsSummary[TODAY_KEY] || { scheduled: 0, done: 0 };

  const weeklyAverage = useMemo(() => {
    const percents = [];
    for (let i = 0; i < 7; i++) {
      const key = toDateKey(addDays(TODAY, -i));
      percents.push(percentFor(statsSummary[key]));
    }
    return averagePercent(percents);
  }, [statsSummary]);

  const activeDaysThisMonth = useMemo(() => {
    let count = 0;
    for (const [key, stats] of Object.entries(statsSummary)) {
      if (key >= currentMonthStart && key <= TODAY_KEY && stats.done > 0) count++;
    }
    return count;
  }, [statsSummary, currentMonthStart]);

  const todayPercent = percentFor(todayStats);

  return (
    <AppShell>
      <div className="px-6 py-10 md:px-12 max-w-4xl">
        <h1 className="font-display text-3xl mb-6">Analytics</h1>

        <div className="mb-8">
          <FocusTimeStat />
        </div>

        {routines === null && <p className="text-inkSoft">Loading…</p>}

        {routines?.length === 0 && (
          <p className="text-inkSoft">
            Add a routine first — your trends and streaks will show up here.
          </p>
        )}

        {routines && routines.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
              <StatCard
                value={todayPercent === null ? "—" : `${todayPercent}%`}
                label="Today's completion"
              />
              <StatCard
                value={currentStreak > 0 ? `${currentStreak} 🔥` : "0"}
                label="Current streak"
              />
              <StatCard
                value={weeklyAverage === null ? "—" : `${weeklyAverage}%`}
                label="Weekly average"
              />
              <StatCard value={activeDaysThisMonth} label="Active days this month" />
              <StatCard value={routines.length} label="Habits tracked" />
              <StatCard value={monthNoteDates.size} label="Journal entries this month" />
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6 mb-8 items-stretch">
              <TodayProgress stats={todayStats} />
              <div className="rounded-xl border border-line bg-surface/40 px-5 py-5">
                <p className="font-display text-xl mb-0.5">Weekly Performance</p>
                <p className="text-sm text-inkSoft mb-3">
                  Your habit completion over the last 7 days
                </p>
                <WeeklyBarChart summary={statsSummary} />
              </div>
            </div>

            <div className="mb-8">
              <MonthlyHeatmap
                year={heatYear}
                month={heatMonth}
                onNavigate={navigateMonth}
                summary={heatmapSummary}
                onSelectDate={setSelectedDateKey}
                noteDates={heatmapNoteDates}
              />
            </div>

            {selectedDateKey && (
              <DateDetailsDrawer
                dateKey={selectedDateKey}
                routines={routines}
                summary={heatmapSummary}
                onClose={() => setSelectedDateKey(null)}
              />
            )}

            <h2 className="font-display text-xl mb-2">Streaks</h2>
            <StreakList
              routines={routines}
              doneMap={doneMap}
              startKey={statsRangeStart}
              endKey={TODAY_KEY}
              todayKey={TODAY_KEY}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireAuth>
      <AnalyticsContent />
    </RequireAuth>
  );
}
