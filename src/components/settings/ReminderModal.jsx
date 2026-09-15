"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createReminder, updateReminder, OFFSET_OPTIONS, REPEAT_TYPES } from "@/lib/reminders";
import { DAY_LABELS } from "@/lib/schedule";

export function ReminderModal({ routines, reminder, onClose }) {
  const { user } = useAuth();
  const isEditing = Boolean(reminder);

  const [routineId, setRoutineId] = useState(reminder?.routineId || routines?.[0]?.id || "");
  const [time, setTime] = useState(reminder?.time || "09:00");
  const [repeatType, setRepeatType] = useState(reminder?.repeat?.type || "daily");
  const [days, setDays] = useState(reminder?.repeat?.days || []);
  const [offsetMinutes, setOffsetMinutes] = useState(reminder?.offsetMinutes ?? 0);
  const [enabled, setEnabled] = useState(reminder?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(dayIndex) {
    setDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!routineId) {
      setError("Choose a routine.");
      return;
    }
    if (repeatType === "custom" && days.length === 0) {
      setError("Pick at least one day, or choose a different repeat option.");
      return;
    }
    const routine = routines.find((r) => r.id === routineId);
    setSaving(true);
    setError("");
    try {
      const data = {
        routineId,
        routineName: routine?.name || "Routine",
        time,
        repeat: { type: repeatType, days: repeatType === "custom" ? days : [] },
        offsetMinutes,
        enabled,
      };
      if (isEditing) {
        await updateReminder(reminder.id, data);
      } else {
        await createReminder(user.uid, data);
      }
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-ink/40 px-0 md:px-6">
      <div className="w-full md:max-w-md bg-paper rounded-t-2xl md:rounded-2xl px-6 py-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">{isEditing ? "Edit reminder" : "New reminder"}</h2>
          <button onClick={onClose} aria-label="Close" className="text-inkSoft hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
          )}

          <label className="block">
            <span className="block text-sm text-inkSoft mb-1">Routine</span>
            <select
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
            >
              {routines?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm text-inkSoft mb-1">Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
            />
          </label>

          <div>
            <span className="block text-sm text-inkSoft mb-2">Repeat</span>
            <div className="flex flex-wrap gap-2 mb-3">
              {REPEAT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setRepeatType(t.value)}
                  className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                    repeatType === t.value
                      ? "bg-ink text-paper border-ink"
                      : "border-line text-inkSoft hover:border-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {repeatType === "custom" && (
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`h-9 w-9 rounded-full text-xs border transition-colors ${
                      days.includes(index)
                        ? "bg-accent text-paper border-accent"
                        : "border-line text-inkSoft hover:border-ink"
                    }`}
                  >
                    {label[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="block text-sm text-inkSoft mb-1">Notify</span>
            <select
              value={offsetMinutes}
              onChange={(e) => setOffsetMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
            >
              {OFFSET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-inkSoft">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Enabled
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-ink py-2.5 text-paper hover:brightness-110 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add reminder"}
          </button>
        </form>
      </div>
    </div>
  );
}
