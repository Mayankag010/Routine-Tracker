"use client";

const SIZE = 140;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TodayProgress({ stats }) {
  const hasSchedule = Boolean(stats && stats.scheduled > 0);
  const percent = hasSchedule ? Math.round((stats.done / stats.scheduled) * 100) : 0;
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * percent) / 100;

  return (
    <div className="rounded-xl border border-line bg-surface/40 px-6 py-6 flex flex-col items-center">
      <p className="font-display text-xl self-start mb-1">Today</p>
      <p className="text-sm text-inkSoft self-start mb-4">
        {hasSchedule ? "How you're doing so far" : "Nothing scheduled today"}
      </p>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgb(var(--color-line))"
            strokeWidth={STROKE}
          />
          {hasSchedule && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={percent >= 100 ? "rgb(var(--color-gold))" : "rgb(var(--color-accent))"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 700ms ease, stroke 700ms ease" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl">{hasSchedule ? `${percent}%` : "—"}</span>
          {hasSchedule && <span className="text-xs text-inkSoft">done today</span>}
        </div>
      </div>

      <p className="text-sm text-inkSoft mt-4 text-center">
        {hasSchedule
          ? `${stats.done} of ${stats.scheduled} habits checked off so far today.`
          : "Add a routine scheduled for today to start tracking."}
      </p>
      {hasSchedule && (
        <div className="flex gap-6 mt-3 text-sm">
          <span>
            <span className="font-semibold">{stats.done}</span>{" "}
            <span className="text-inkSoft">completed</span>
          </span>
          <span>
            <span className="font-semibold">{stats.scheduled - stats.done}</span>{" "}
            <span className="text-inkSoft">remaining</span>
          </span>
        </div>
      )}
    </div>
  );
}
