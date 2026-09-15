"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { subscribeSessionsSince } from "@/lib/timer/sessions";
import { formatDurationShort } from "@/lib/timer/format";
import { addDays } from "@/lib/schedule";

export function FocusTimeStat() {
  const { user } = useAuth();
  const [totalSeconds, setTotalSeconds] = useState(null);

  useEffect(() => {
    if (!user) return;
    const since = addDays(new Date(), -6);
    since.setHours(0, 0, 0, 0);
    return subscribeSessionsSince(user.uid, since.toISOString(), (sessions) => {
      setTotalSeconds(sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0));
    });
  }, [user]);

  return (
    <div className="rounded-xl border border-line bg-surface/40 px-4 py-4 flex items-center justify-between">
      <div>
        <p className="font-display text-2xl mb-0.5">
          {totalSeconds === null ? "—" : formatDurationShort(totalSeconds)}
        </p>
        <p className="text-xs text-inkSoft">Focus Time — This Week</p>
      </div>
      <Link href="/timer" className="text-sm text-accent hover:underline">
        View Timer
      </Link>
    </div>
  );
}
