"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { ColorPicker } from "@/components/ColorPicker";
import { SchedulePicker } from "@/components/SchedulePicker";
import { createRoutine, updateRoutine, deleteRoutine } from "@/lib/routines";
import { useAuth } from "@/lib/auth-context";
import {
  ROUTINE_TYPES,
  isNumericType,
  defaultTargetForType,
  defaultUnitForType,
} from "@/lib/routine-types";

const DEFAULT_COLOR = "#2C8F76";

// Target Hours/Minutes are constrained to 2-digit values so a routine's
// duration target can never balloon into something absurd (and, for
// minutes, can never reach/exceed 60 — that's what the hours field is for).
// Clamped in the change handler itself (not just via the `max` attribute),
// since `max` on a number input only affects the stepper arrows and native
// validity styling — it does not stop someone from typing "100" directly.
const MAX_TARGET_HOURS = 99;
const MAX_TARGET_MINUTES = 59;

function clampDigits(rawValue, max) {
  if (rawValue === "") return "";
  const n = Number(rawValue);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.trunc(n)));
}

export function RoutineModal({ routine, onClose }) {
  const { user } = useAuth();
  const isEditing = Boolean(routine);

  const [name, setName] = useState(routine?.name || "");
  const [description, setDescription] = useState(routine?.description || "");
  const [icon, setIcon] = useState(routine?.icon || "");
  const [color, setColor] = useState(routine?.color || DEFAULT_COLOR);
  const [schedule, setSchedule] = useState(
    routine?.schedule || { type: "daily", days: [] }
  );
  const [type, setType] = useState(routine?.type || "checkbox");
  const [target, setTarget] = useState(
    routine?.target ?? defaultTargetForType(routine?.type || "checkbox")
  );
  const [unit, setUnit] = useState(routine?.unit || defaultUnitForType(routine?.type || "checkbox"));
  const [durationHours, setDurationHours] = useState(
    routine?.type === "duration" ? Math.floor((routine.target || 0) / 60) : 0
  );
  const [durationMinutes, setDurationMinutes] = useState(
    routine?.type === "duration" ? (routine.target || 0) % 60 : 30
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleTypeChange(nextType) {
    setType(nextType);
    // Switching type resets target/unit to sensible defaults for that
    // type — this only changes what *future* days compare against; past
    // completion docs are never touched.
    setTarget(defaultTargetForType(nextType));
    setUnit(defaultUnitForType(nextType));
    if (nextType === "duration") {
      setDurationHours(0);
      setDurationMinutes(30);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your routine a name.");
      return;
    }
    if (schedule.type === "custom" && schedule.days.length === 0) {
      setError("Pick at least one day, or choose a different schedule.");
      return;
    }

    let finalTarget = 1;
    let finalUnit = "";
    if (type === "duration") {
      finalTarget = Number(durationHours || 0) * 60 + Number(durationMinutes || 0);
      if (finalTarget <= 0) {
        setError("Set a duration target greater than 0.");
        return;
      }
      finalUnit = "minutes";
    } else if (isNumericType(type)) {
      finalTarget = Number(target);
      if (!Number.isFinite(finalTarget) || finalTarget <= 0) {
        setError("Set a target greater than 0.");
        return;
      }
      finalUnit = unit.trim();
    }

    setSaving(true);
    setError("");
    const payload = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
      color,
      schedule,
      type,
      target: finalTarget,
      unit: finalUnit,
    };
    try {
      if (isEditing) {
        await updateRoutine(routine.id, payload);
      } else {
        await createRoutine(user.uid, payload);
      }
      onClose();
    } catch (err) {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${routine.name}"? This can't be undone.`)) return;
    setSaving(true);
    await deleteRoutine(routine.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end md:items-center justify-center bg-ink/40 px-0 md:px-6">
      <div className="w-full md:max-w-md bg-paper rounded-t-2xl md:rounded-2xl px-6 py-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">
            {isEditing ? "Edit routine" : "New routine"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-inkSoft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <label className="block w-20 shrink-0">
              <span className="block text-sm text-inkSoft mb-1">Icon</span>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                placeholder="🔥"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-center text-lg focus:border-accent"
              />
            </label>
            <label className="block flex-1">
              <span className="block text-sm text-inkSoft mb-1">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning run"
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
                autoFocus
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm text-inkSoft mb-1">
              Description <span className="text-inkSoft/70">(optional)</span>
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does success look like?"
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
            />
          </label>

          <div>
            <span className="block text-sm text-inkSoft mb-2">Routine type</span>
            <div className="grid grid-cols-2 gap-2">
              {ROUTINE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    type === t.value
                      ? "border-ink bg-paperDark/40"
                      : "border-line hover:border-ink/40"
                  }`}
                >
                  <span className="block text-sm">{t.label}</span>
                  <span className="block text-xs text-inkSoft">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {type === "duration" && (
            <div className="flex gap-3">
              <label className="block flex-1">
                <span className="block text-sm text-inkSoft mb-1">Target hours</span>
                <input
                  type="number"
                  min="0"
                  max={MAX_TARGET_HOURS}
                  maxLength={2}
                  inputMode="numeric"
                  value={durationHours}
                  onChange={(e) => setDurationHours(clampDigits(e.target.value, MAX_TARGET_HOURS))}
                  className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
                />
              </label>
              <label className="block flex-1">
                <span className="block text-sm text-inkSoft mb-1">Target minutes</span>
                <input
                  type="number"
                  min="0"
                  max={MAX_TARGET_MINUTES}
                  maxLength={2}
                  inputMode="numeric"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(clampDigits(e.target.value, MAX_TARGET_MINUTES))}
                  className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
                />
              </label>
            </div>
          )}

          {(type === "count" || type === "goal") && (
            <div className="flex gap-3">
              <label className="block flex-1">
                <span className="block text-sm text-inkSoft mb-1">Target</span>
                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
                />
              </label>
              <label className="block flex-1">
                <span className="block text-sm text-inkSoft mb-1">Unit</span>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={type === "count" ? "reps" : "pages"}
                  className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
                />
              </label>
            </div>
          )}

          <ColorPicker value={color} onChange={setColor} />

          <SchedulePicker schedule={schedule} onChange={setSchedule} />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-ink py-2.5 text-paper hover:brightness-110 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add routine"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                aria-label="Delete routine"
                className="rounded-lg border border-line p-2.5 text-red-600 hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
