"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import {
  subscribeCompletion,
  setCompletion,
  subscribeCompletionValue,
  setProgressValue,
} from "@/lib/routines";
import { toDateKey } from "@/lib/schedule";
import {
  getRoutineType,
  getTarget,
  formatProgress,
  progressPercent,
  stepForType,
} from "@/lib/routine-types";

/**
 * `streak`, when provided, is { current, best } for this routine — only
 * pass it in contexts where a streak badge makes sense (the "Today"
 * checklist). Leave it out (e.g. on the calendar's past-day view) and no
 * badge renders.
 */
export function RoutineRow({ routine, dateKey, onEdit, streak }) {
  const type = getRoutineType(routine);
  const isToday = dateKey === toDateKey(new Date());

  if (type === "checkbox") {
    return (
      <CheckboxRow
        routine={routine}
        dateKey={dateKey}
        onEdit={onEdit}
        streak={streak}
        isToday={isToday}
      />
    );
  }

  return (
    <NumericRow
      routine={routine}
      dateKey={dateKey}
      onEdit={onEdit}
      streak={streak}
      isToday={isToday}
    />
  );
}

function CheckboxRow({ routine, dateKey, onEdit, streak, isToday }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    return subscribeCompletion(routine.id, dateKey, setDone);
  }, [routine.id, dateKey]);

  return (
    <li className="flex items-center gap-4 py-3">
      <button
        onClick={() => setCompletion(routine.id, dateKey, !done)}
        aria-label={done ? "Mark not done" : "Mark done"}
        aria-pressed={done}
        className="h-7 w-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: routine.color,
          backgroundColor: done ? routine.color : "transparent",
        }}
      >
        {done && <Check size={16} className="text-paper" strokeWidth={3} />}
      </button>
      <button onClick={() => onEdit(routine)} className="flex-1 text-left">
        <span className={done ? "text-inkSoft line-through" : "text-ink"}>
          {routine.icon ? `${routine.icon} ` : ""}
          {routine.name}
        </span>
        {streak && <StreakHint streak={streak} done={done} isToday={isToday} />}
      </button>
    </li>
  );
}

function NumericRow({ routine, dateKey, onEdit, streak, isToday }) {
  const type = getRoutineType(routine);
  const target = getTarget(routine);
  const step = stepForType(type);

  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeCompletionValue(routine.id, dateKey, (data) => {
      setValue(data.value);
      setDone(data.done);
    });
  }, [routine.id, dateKey]);

  async function adjust(delta) {
    const next = Math.max(0, value + delta);
    setValue(next);
    setSaving(true);
    try {
      await setProgressValue(routine.id, dateKey, next, target);
    } finally {
      setSaving(false);
    }
  }

  const percent = progressPercent(value, target);

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onEdit(routine)} className="text-left flex-1 min-w-0">
          <span className={done ? "text-inkSoft" : "text-ink"}>
            {routine.icon ? `${routine.icon} ` : ""}
            {routine.name}
          </span>
          {streak && <StreakHint streak={streak} done={done} isToday={isToday} />}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-inkSoft tabular-nums whitespace-nowrap">
            {formatProgress(routine, value)}
          </span>
          <button
            type="button"
            onClick={() => adjust(-step)}
            disabled={saving || value <= 0}
            aria-label={`Decrease by ${step}`}
            className="h-6 w-6 rounded-full border border-line flex items-center justify-center hover:border-ink disabled:opacity-30 transition-colors"
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            onClick={() => adjust(step)}
            disabled={saving}
            aria-label={`Increase by ${step}`}
            className="h-6 w-6 rounded-full border flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ borderColor: routine.color }}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-paperDark mt-2 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: routine.color }}
        />
      </div>
    </li>
  );
}

function StreakHint({ streak, done, isToday }) {
  const { current, best } = streak;

  let text;
  if (done) {
    text = `🔥 ${current} day${current === 1 ? "" : "s"} streak`;
  } else if (isToday && current > 0) {
    text = `🔥 ${current} day${current === 1 ? "" : "s"} — complete today to reach ${current + 1}`;
  } else if (isToday && best > 0) {
    text = "Streak lost — complete today to start again";
  } else if (isToday) {
    text = "Complete today to start a streak";
  } else {
    text = `🔥 ${current} day${current === 1 ? "" : "s"} streak`;
  }

  return <p className="text-xs text-inkSoft mt-0.5">{text}</p>;
}
