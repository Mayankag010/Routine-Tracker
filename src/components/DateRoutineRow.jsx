"use client";

import { useEffect, useState } from "react";
import { Check, RotateCcw, Minus, Plus } from "lucide-react";
import {
  subscribeCompletion,
  setCompletion,
  subscribeCompletionValue,
  setProgressValue,
} from "@/lib/routines";
import {
  getRoutineType,
  getTarget,
  formatProgress,
  progressPercent,
  stepForType,
} from "@/lib/routine-types";

export function DateRoutineRow({ routine, dateKey, editable }) {
  const type = getRoutineType(routine);
  if (type === "checkbox") {
    return <CheckboxDateRow routine={routine} dateKey={dateKey} editable={editable} />;
  }
  return <NumericDateRow routine={routine} dateKey={dateKey} editable={editable} />;
}

function CheckboxDateRow({ routine, dateKey, editable }) {
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoadError(false);
    return subscribeCompletion(
      routine.id,
      dateKey,
      setDone,
      () => setLoadError(true)
    );
  }, [routine.id, dateKey, attempt]);

  useEffect(() => {
    if (status !== "saved") return;
    const timeout = setTimeout(() => setStatus("idle"), 1500);
    return () => clearTimeout(timeout);
  }, [status]);

  async function toggle() {
    if (!editable) return;
    setStatus("saving");
    try {
      await setCompletion(routine.id, dateKey, !done);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (loadError) {
    return <LoadErrorRow routine={routine} onRetry={() => { setLoadError(false); setAttempt((a) => a + 1); }} />;
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <button
        onClick={toggle}
        disabled={!editable}
        aria-label={done ? "Mark not completed" : "Mark completed"}
        aria-pressed={done}
        className={`h-6 w-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
          !editable ? "opacity-40 cursor-not-allowed" : ""
        }`}
        style={{
          borderColor: routine.color,
          backgroundColor: done ? routine.color : "transparent",
        }}
      >
        {done && <Check size={14} className="text-paper" strokeWidth={3} />}
      </button>
      <div className="flex-1">
        <p className="text-sm">
          {routine.icon ? `${routine.icon} ` : ""}
          {routine.name}
        </p>
        <p className="text-xs text-inkSoft">{done ? "Completed" : "Not completed"}</p>
      </div>
      <StatusTag status={status} onRetry={toggle} />
    </li>
  );
}

function NumericDateRow({ routine, dateKey, editable }) {
  const type = getRoutineType(routine);
  const target = getTarget(routine);
  const step = stepForType(type);

  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState("idle");
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setLoadError(false);
    return subscribeCompletionValue(
      routine.id,
      dateKey,
      (data) => {
        setValue(data.value);
        setDone(data.done);
      },
      () => setLoadError(true)
    );
  }, [routine.id, dateKey, attempt]);

  useEffect(() => {
    if (status !== "saved") return;
    const timeout = setTimeout(() => setStatus("idle"), 1500);
    return () => clearTimeout(timeout);
  }, [status]);

  async function adjust(delta) {
    if (!editable) return;
    const next = Math.max(0, value + delta);
    setValue(next);
    setStatus("saving");
    try {
      await setProgressValue(routine.id, dateKey, next, target);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (loadError) {
    return <LoadErrorRow routine={routine} onRetry={() => { setLoadError(false); setAttempt((a) => a + 1); }} />;
  }

  const percent = progressPercent(value, target);

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${done ? "text-inkSoft" : "text-ink"}`}>
            {routine.icon ? `${routine.icon} ` : ""}
            {routine.name}
          </p>
          <p className="text-xs text-inkSoft">{formatProgress(routine, value)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => adjust(-step)}
            disabled={!editable || value <= 0}
            aria-label={`Decrease by ${step}`}
            className="h-6 w-6 rounded-full border border-line flex items-center justify-center hover:border-ink disabled:opacity-30 transition-colors"
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            onClick={() => adjust(step)}
            disabled={!editable}
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
      <div className="mt-1 text-right">
        <StatusTag status={status} onRetry={() => adjust(0)} />
      </div>
    </li>
  );
}

function StatusTag({ status, onRetry }) {
  if (status === "saving") return <span className="text-xs text-inkSoft">Saving…</span>;
  if (status === "saved") return <span className="text-xs text-accent">Updated</span>;
  if (status === "error") {
    return (
      <button onClick={onRetry} className="text-xs text-red-600 hover:underline">
        Couldn't save — retry
      </button>
    );
  }
  return null;
}

function LoadErrorRow({ routine, onRetry }) {
  return (
    <li className="flex items-center justify-between py-3 text-sm">
      <span className="text-inkSoft">{routine.name} — couldn't load</span>
      <button onClick={onRetry} className="flex items-center gap-1 text-accent hover:underline">
        <RotateCcw size={14} />
        Retry
      </button>
    </li>
  );
}
