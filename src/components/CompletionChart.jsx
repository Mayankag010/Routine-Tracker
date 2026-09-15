"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { eachDateKeyInRange, fromDateKey } from "@/lib/schedule";

export function CompletionChart({ summary, startKey, endKey }) {
  const days = eachDateKeyInRange(startKey, endKey);

  const data = days
    .map((key) => {
      const stats = summary[key];
      if (!stats || stats.scheduled === 0) return null;
      const date = fromDateKey(key);
      return {
        key,
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        rate: Math.round((stats.done / stats.scheduled) * 100),
      };
    })
    .filter(Boolean);

  if (data.length === 0) {
    return (
      <p className="text-inkSoft py-8 text-center">
        Not enough tracked days yet to show a trend.
      </p>
    );
  }

  // Thin out x-axis labels so they don't overlap on longer ranges.
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  return (
    <div className="h-56 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="completionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--color-line))" vertical={false} />
          <XAxis
            dataKey="label"
            interval={tickInterval}
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
          <Tooltip
            formatter={(value) => [`${value}%`, "Completed"]}
            contentStyle={{
              backgroundColor: "rgb(var(--color-paper))",
              border: "1px solid rgb(var(--color-line))",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="rgb(var(--color-accent))"
            strokeWidth={2}
            fill="url(#completionFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
