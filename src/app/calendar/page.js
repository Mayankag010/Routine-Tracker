"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { WeekStrip } from "@/components/WeekStrip";
import { MonthGrid } from "@/components/MonthGrid";
import { DayChecklist } from "@/components/DayChecklist";
import { DailyNoteSection } from "@/components/DailyNoteSection";
import { RoutineModal } from "@/components/RoutineModal";
import { useAuth } from "@/lib/auth-context";
import { subscribeRoutines } from "@/lib/routines";
import { useCompletionSummary } from "@/lib/useCompletionSummary";
import { useNoteDatesInRange } from "@/lib/useNoteDatesInRange";
import { toDateKey, fromDateKey, addDays } from "@/lib/schedule";

const TODAY_KEY = toDateKey(new Date());

function CalendarContent() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState(null);
  const [selectedKey, setSelectedKey] = useState(TODAY_KEY);
  const [viewDate, setViewDate] = useState(new Date());
  const [editing, setEditing] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    return subscribeRoutines(user.uid, setRoutines);
  }, [user]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Range covers the visible month plus the trailing-7-day week strip,
  // so one subscription set feeds both widgets.
  const rangeStart = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const weekStart = addDays(new Date(), -6);
    return toDateKey(monthStart < weekStart ? monthStart : weekStart);
  }, [year, month]);

  const rangeEnd = useMemo(() => {
    const monthEnd = new Date(year, month + 1, 0);
    const todayKey = TODAY_KEY;
    return monthEnd > fromDateKey(todayKey) ? todayKey : toDateKey(monthEnd);
  }, [year, month]);

  const summary = useCompletionSummary(routines, rangeStart, rangeEnd);
  const noteDates = useNoteDatesInRange(user?.uid, rangeStart, rangeEnd);

  function navigateMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
  }

  const selectedDate = fromDateKey(selectedKey);
  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell>
      <div className="px-6 py-10 md:px-12 max-w-xl">
        <h1 className="font-display text-3xl mb-8">Calendar</h1>

        {routines === null && <p className="text-inkSoft">Loading…</p>}

        {routines?.length === 0 && (
          <>
            <p className="text-inkSoft mb-8">
              Add a routine first to start tracking days.
            </p>
            <DailyNoteSection dateKey={selectedKey} dateLabel={selectedLabel} />
          </>
        )}

        {routines && routines.length > 0 && (
          <>
            <WeekStrip selectedKey={selectedKey} onSelect={setSelectedKey} summary={summary} />

            <div className="mb-8">
              <MonthGrid
                year={year}
                month={month}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                onNavigate={navigateMonth}
                summary={summary}
                noteDates={noteDates}
              />
            </div>

            <div className="mb-8">
              <p className="text-inkSoft mb-1 text-sm">
                {selectedKey === TODAY_KEY ? "Today" : selectedLabel}
              </p>
              <DayChecklist date={selectedDate} routines={routines} onEditRoutine={setEditing} />
            </div>

            <div>
              <DailyNoteSection dateKey={selectedKey} dateLabel={selectedLabel} />
            </div>
          </>
        )}
      </div>

      {editing !== undefined && (
        <RoutineModal routine={editing} onClose={() => setEditing(undefined)} />
      )}
    </AppShell>
  );
}

export default function CalendarPage() {
  return (
    <RequireAuth>
      <CalendarContent />
    </RequireAuth>
  );
}
