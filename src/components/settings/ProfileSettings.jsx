"use client";

import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSavedMessage } from "@/lib/useSavedMessage";

const AVATAR_EMOJIS = ["🙂", "🔥", "💪", "📚", "🧘", "🏃", "🎯", "🌱", "☕", "🎨"];

export function ProfileSettings({ user, prefs, onSave }) {
  const [displayName, setDisplayName] = useState(user.displayName || prefs.displayName || "");
  const [avatarEmoji, setAvatarEmoji] = useState(prefs.avatarEmoji || "🙂");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, flash] = useSavedMessage();

  const createdAt = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await onSave({ displayName: displayName.trim(), avatarEmoji });
      flash();
    } catch {
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Profile</h2>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center text-3xl">
          {avatarEmoji}
        </div>
        <div className="flex flex-wrap gap-2 max-w-xs">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatarEmoji(emoji)}
              aria-label={`Use avatar ${emoji}`}
              className={`h-9 w-9 rounded-full flex items-center justify-center text-lg border transition-transform hover:scale-110 ${
                avatarEmoji === emoji ? "border-accent bg-accent/10" : "border-line"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <label className="block mb-4">
        <span className="block text-sm text-inkSoft mb-1">Display name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent max-w-sm"
        />
      </label>

      <label className="block mb-4">
        <span className="block text-sm text-inkSoft mb-1">Email</span>
        <input
          value={user.email || ""}
          disabled
          className="w-full rounded-lg border border-line bg-paperDark px-4 py-2.5 text-inkSoft max-w-sm cursor-not-allowed"
        />
      </label>

      {createdAt && (
        <p className="text-xs text-inkSoft mb-6">Account created on {createdAt}</p>
      )}

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
