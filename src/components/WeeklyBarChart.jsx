"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { percentFor, INTENSITY_COLORS, intensityBucket } from "@/lib/analytics";
import { addDays, toDateKey } from "@/lib/schedule";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.percent === null) {
    return (
      <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{d.fullLabel}</p>
        <p className="text-inkSoft">Nothing scheduled</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{d.fullLabel}</p>
      <p className="text-inkSoft">
        {d.done} of {d.scheduled} habits completed
      </p>
      <p className="text-ink">{d.percent}%</p>
    </div>
  );
}

export function WeeklyBarChart({ summary }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  const data = days.map((date) => {
    const key = toDateKey(date);
    const stats = summary[key];
    const percent = percentFor(stats);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      fullLabel: date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      percent,
      barValue: percent ?? 0,
      done: stats?.done ?? 0,
      scheduled: stats?.scheduled ?? 0,
    };
  });

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--color-line))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgb(var(--color-ink-soft))", fontSize: 12 }}
            axisLine={{ stroke: "rgb(var(--color-line))" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "rgb(var(--color-ink-soft))", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgb(var(--color-line))", opacity: 0.4 }} />
          <Bar dataKey="barValue" radius={[6, 6, 0, 0]} animationDuration={600}>
            {data.map((d) => (
              <Cell key={d.key} fill={INTENSITY_COLORS[intensityBucket(d.percent)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
