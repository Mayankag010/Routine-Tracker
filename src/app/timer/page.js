"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { CountdownTimer } from "@/components/timer/CountdownTimer";
import { StopwatchTimer } from "@/components/timer/StopwatchTimer";
import { PomodoroTimer } from "@/components/timer/PomodoroTimer";
import { RecentSessions } from "@/components/timer/RecentSessions";
import { useAuth } from "@/lib/auth-context";
import { subscribeRoutines } from "@/lib/routines";

const MODES = [
  { value: "countdown", label: "Countdown" },
  { value: "stopwatch", label: "Stopwatch" },
  { value: "pomodoro", label: "Pomodoro" },
];

function TimerContent() {
  const { user } = useAuth();
  const [mode, setMode] = useState("countdown");
  const [routines, setRoutines] = useState(null);

  useEffect(() => {
    if (!user) return;
    return subscribeRoutines(user.uid, setRoutines);
  }, [user]);

  // Only duration-type routines make sense to attach a session to — see
  // Part 7 of the timer spec ("Only connect timer sessions to routines
  // when the selected routine supports duration tracking").
  const durationRoutines = routines?.filter((r) => r.type === "duration") || [];

  return (
    <AppShell>
      <div className="px-6 py-10 md:px-12 max-w-xl">
        <h1 className="font-display text-3xl mb-6">Timer</h1>

        <div className="flex gap-2 mb-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={`flex-1 rounded-full px-4 py-2 text-sm border transition-colors ${
                mode === m.value
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-inkSoft hover:border-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/*
          Each mode keeps its own timestamp-based state persisted to
          localStorage (lib/timer/use*Engine.js), so switching tabs — or
          leaving and refreshing the page — never loses or corrupts a
          running timer in another mode; remounting just re-derives the
          correct remaining/elapsed time from wall-clock time.
        */}
        {mode === "countdown" && <CountdownTimer durationRoutines={durationRoutines} />}
        {mode === "stopwatch" && <StopwatchTimer durationRoutines={durationRoutines} />}
        {mode === "pomodoro" && <PomodoroTimer durationRoutines={durationRoutines} />}

        <div className="mt-10">
          <RecentSessions />
        </div>
      </div>
    </AppShell>
  );
}

export default function TimerPage() {
  return (
    <RequireAuth>
      <TimerContent />
    </RequireAuth>
  );
}
