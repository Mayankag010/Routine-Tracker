"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { ReminderModal } from "@/components/settings/ReminderModal";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { Toggle } from "@/components/settings/Toggle";
import { deleteReminder, setReminderEnabled } from "@/lib/reminders";
import { DAY_LABELS } from "@/lib/schedule";

function repeatLabel(repeat) {
  if (!repeat) return "Once";
  switch (repeat.type) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekends":
      return "Weekends";
    case "custom":
      return (repeat.days || [])
        .slice()
        .sort((a, b) => a - b)
        .map((d) => DAY_LABELS[d])
        .join(" ") || "No days selected";
    case "once":
    default:
      return "Once";
  }
}

function formatTime(time) {
  const [h, m] = (time || "00:00").split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function RemindersSettings({ routines, reminders }) {
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState(null);

  async function handleDelete() {
    await deleteReminder(deleting.id);
    setDeleting(null);
  }

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Reminders</h2>

      {reminders.length === 0 && (
        <p className="text-sm text-inkSoft mb-6">
          No reminders yet. Add one to get a nudge before a routine's scheduled time.
        </p>
      )}

      <ul className="divide-y divide-line border-t border-line mb-6">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm text-ink">{reminder.routineName}</p>
              <p className="text-xs text-inkSoft">
                {formatTime(reminder.time)} · {repeatLabel(reminder.repeat)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Toggle
                checked={Boolean(reminder.enabled)}
                onChange={(v) => setReminderEnabled(reminder.id, v)}
              />
              <button
                onClick={() => setEditing(reminder)}
                aria-label="Edit reminder"
                className="text-inkSoft hover:text-ink p-1.5"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleting(reminder)}
                aria-label="Delete reminder"
                className="text-inkSoft hover:text-red-600 p-1.5"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setEditing(null)}
        disabled={!routines || routines.length === 0}
        className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper hover:brightness-110 transition-colors disabled:opacity-50"
      >
        <Plus size={16} />
        Add Reminder
      </button>
      {routines && routines.length === 0 && (
        <p className="text-xs text-inkSoft mt-2">Add a routine first before setting a reminder.</p>
      )}

      {editing !== undefined && (
        <ReminderModal
          routines={routines}
          reminder={editing}
          onClose={() => setEditing(undefined)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete reminder?"
          description={`This removes the reminder for "${deleting.routineName}".`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
