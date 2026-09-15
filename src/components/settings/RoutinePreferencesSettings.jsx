"use client";

import { useState } from "react";
import { useSavedMessage } from "@/lib/useSavedMessage";
import { formatDatePref } from "@/lib/date-format";

const AFTER_COMPLETION_OPTIONS = [
  { value: "stay", label: "Stay on this routine" },
  { value: "next-routine", label: "Jump to the next routine" },
  { value: "dashboard", label: "Return to Today" },
];

export function RoutinePreferencesSettings({ prefs, onSave }) {
  const rp = prefs.routinePreferences;
  const [defaultReminderTime, setDefaultReminderTime] = useState(rp.defaultReminderTime);
  const [defaultCategory, setDefaultCategory] = useState(rp.defaultCategory);
  const [defaultAfterCompletion, setDefaultAfterCompletion] = useState(rp.defaultAfterCompletion);
  const [weekStart, setWeekStart] = useState(rp.weekStart);
  const [dateFormat, setDateFormat] = useState(rp.dateFormat);
  const [saving, setSaving] = useState(false);
  const [saved, flash] = useSavedMessage();

  async function handleSave() {
    setSaving(true);
    await onSave({
      routinePreferences: {
        defaultReminderTime,
        defaultCategory,
        defaultAfterCompletion,
        weekStart,
        dateFormat,
      },
    });
    setSaving(false);
    flash();
  }

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Routine Preferences</h2>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <label className="block">
          <span className="block text-sm text-inkSoft mb-1">Default routine reminder time</span>
          <input
            type="time"
            value={defaultReminderTime}
            onChange={(e) => setDefaultReminderTime(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="block text-sm text-inkSoft mb-1">Default category</span>
          <input
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            placeholder="e.g. Health"
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
          />
        </label>
      </div>

      <label className="block mb-6 max-w-sm">
        <span className="block text-sm text-inkSoft mb-1">Default behavior after completing a routine</span>
        <select
          value={defaultAfterCompletion}
          onChange={(e) => setDefaultAfterCompletion(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
        >
          {AFTER_COMPLETION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-6">
        <span className="block text-sm text-inkSoft mb-2">Week starts on</span>
        <div className="flex gap-2">
          {["monday", "sunday"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setWeekStart(value)}
              className={`rounded-full px-4 py-2 text-sm border transition-colors capitalize ${
                weekStart === value
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-inkSoft hover:border-ink"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <span className="block text-sm text-inkSoft mb-2">Date format</span>
        <div className="flex gap-2">
          {["DD/MM/YYYY", "MM/DD/YYYY"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDateFormat(value)}
              className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                dateFormat === value
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-inkSoft hover:border-ink"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="text-xs text-inkSoft mt-2">Example: {formatDatePref(new Date(), dateFormat)}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm text-paper hover:brightness-110 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-accent">{saved}</span>}
      </div>
    </div>
  );
}
