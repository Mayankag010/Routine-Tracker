"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeNote, saveNote, deleteNote, NOTE_MAX_LENGTH } from "@/lib/daily-notes";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";

function draftKey(uid, dateKey) {
  return `daily-note-draft:${uid}:${dateKey}`;
}

export function DailyNoteSection({ dateKey, dateLabel, compact = false }) {
  const { user } = useAuth();
  const [note, setNote] = useState(undefined); // undefined = loading, null = none
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(""); // '' | 'saved' | 'error'
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const savedFlashTimeout = useRef(null);

  useEffect(() => {
    if (!user) return;
    setNote(undefined);
    return subscribeNote(user.uid, dateKey, setNote);
  }, [user, dateKey]);

  useEffect(() => () => clearTimeout(savedFlashTimeout.current), []);

  function startEditing() {
    const key = draftKey(user.uid, dateKey);
    const localDraft = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const savedContent = note?.content || "";
    setDraft(localDraft !== null && localDraft !== savedContent ? localDraft : savedContent);
    setStatus("");
    setEditing(true);
  }

  function handleDraftChange(value) {
    const next = value.slice(0, NOTE_MAX_LENGTH);
    setDraft(next);
    try {
      window.localStorage.setItem(draftKey(user.uid, dateKey), next);
    } catch {
      // localStorage unavailable — the explicit Save button is still the
      // real persistence path, this is just a nice-to-have.
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(draftKey(user.uid, dateKey));
    } catch {
      // ignore
    }
  }

  function handleCancel() {
    clearDraft();
    setEditing(false);
    setStatus("");
  }

  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      await saveNote(user.uid, dateKey, draft.trim(), { isNew: !note });
      clearDraft();
      setEditing(false);
      setStatus("saved");
      savedFlashTimeout.current = setTimeout(() => setStatus(""), 2500);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteNote(user.uid, dateKey);
      setConfirmingDelete(false);
      setEditing(false);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const heading = compact ? "Today's Note" : "Daily Notes";
  const wrapperClass = compact
    ? "rounded-xl border border-line px-5 py-4"
    : "";

  return (
    <div className={wrapperClass}>
      <p className={compact ? "font-display text-lg mb-2" : "font-display text-xl mb-2"}>
        {heading}
      </p>

      {note === undefined && <p className="text-sm text-inkSoft">Loading…</p>}

      {note !== undefined && !editing && (
        <>
          {note?.content ? (
            <>
              <p className="text-sm text-ink whitespace-pre-wrap mb-3">{note.content}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={startEditing}
                  className="text-sm text-accent hover:underline"
                >
                  Edit
                </button>
                {!compact && (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-inkSoft mb-3">
                {compact
                  ? "Write something about today..."
                  : `No notes for this day. Write a few words about ${
                      dateLabel ? dateLabel.toLowerCase() : "your day"
                    }.`}
              </p>
              <button
                onClick={startEditing}
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:brightness-110 transition-colors"
              >
                + Add note
              </button>
            </>
          )}
        </>
      )}

      {editing && (
        <div>
          <textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            placeholder="How was your day?"
            rows={compact ? 3 : 4}
            maxLength={NOTE_MAX_LENGTH}
            autoFocus
            className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink focus:border-accent resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-inkSoft">
              {draft.length} / {NOTE_MAX_LENGTH} characters
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="text-sm text-inkSoft hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper hover:brightness-110 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "saved" && <p className="text-sm text-accent mt-2">✓ Note saved.</p>}
      {status === "error" && (
        <p className="text-sm text-red-600 mt-2">Couldn't save your note. Please try again.</p>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this note?"
          description="This journal entry will be permanently deleted."
          confirmLabel="Delete"
          confirming={saving}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
