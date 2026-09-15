"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeRecentSessions } from "@/lib/timer/sessions";
import { formatDurationShort } from "@/lib/timer/format";
import { toDateKey } from "@/lib/schedule";

const TYPE_LABELS = {
  countdown: "Countdown",
  stopwatch: "Stopwatch",
  "pomodoro-focus": "Focus",
};

const COLLAPSED_COUNT = 5;

function dayLabel(iso) {
  const date = new Date(iso);
  const key = toDateKey(date);
  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(new Date(Date.now() - 86400000));
  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function RecentSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeRecentSessions(user.uid, setSessions);
  }, [user]);

  return (
    <div>
      <h2 className="font-display text-xl mb-3">Recent Sessions</h2>

      {sessions === null && <p className="text-sm text-inkSoft">Loading…</p>}

      {sessions?.length === 0 && (
        <p className="text-sm text-inkSoft">No sessions yet — finish a timer to see it here.</p>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="divide-y divide-line border-t border-line">
          {(expanded ? sessions : sessions.slice(0, COLLAPSED_COUNT)).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-ink">{s.routineName || TYPE_LABELS[s.timerType] || "Session"}</p>
                <p className="text-xs text-inkSoft">
                  {dayLabel(s.startedAt)} · {timeLabel(s.startedAt)}
                </p>
              </div>
              <span className="tabular-nums text-inkSoft">{formatDurationShort(s.durationSeconds)}</span>
            </li>
          ))}
        </ul>
      )}

      {sessions && sessions.length > COLLAPSED_COUNT && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-3 text-sm text-accent hover:underline">
          {expanded ? "Show less" : "View all"}
        </button>
      )}
    </div>
  );
}
