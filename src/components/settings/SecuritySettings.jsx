"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSavedMessage } from "@/lib/useSavedMessage";

export function SecuritySettings({ user }) {
  const isPasswordAuth = user.providerData?.[0]?.providerId === "password";
  const providerLabel = isPasswordAuth
    ? "Email & password"
    : user.providerData?.[0]?.providerId?.replace(".com", "") || "Unknown";

  const [changing, setChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, flash] = useSavedMessage();

  const lastSignIn = user.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("New password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setChanging(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      flash("Password updated");
    } catch (err) {
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setError("Current password is incorrect.");
      } else {
        setError("Couldn't change your password. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Security</h2>

      <dl className="space-y-3 mb-8 max-w-sm">
        <div className="flex justify-between text-sm">
          <dt className="text-inkSoft">Sign-in method</dt>
          <dd className="text-ink capitalize">{providerLabel}</dd>
        </div>
        <div className="flex justify-between text-sm">
          <dt className="text-inkSoft">Account email</dt>
          <dd className="text-ink">{user.email}</dd>
        </div>
        {lastSignIn && (
          <div className="flex justify-between text-sm">
            <dt className="text-inkSoft">Last sign-in</dt>
            <dd className="text-ink">{lastSignIn}</dd>
          </div>
        )}
      </dl>

      {isPasswordAuth ? (
        !changing ? (
          <button
            onClick={() => setChanging(true)}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-paperDark transition-colors"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
            )}
            <label className="block">
              <span className="block text-sm text-inkSoft mb-1">Current password</span>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-inkSoft mb-1">New password</span>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-inkSoft mb-1">Confirm new password</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-ink px-4 py-2 text-sm text-paper hover:brightness-110 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save new password"}
              </button>
              <button
                type="button"
                onClick={() => setChanging(false)}
                className="text-sm text-inkSoft hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )
      ) : (
        <p className="text-sm text-inkSoft max-w-sm">
          Your password is managed by {providerLabel}. Manage it from your{" "}
          {providerLabel} account settings.
        </p>
      )}

      {saved && <p className="text-sm text-accent mt-3">{saved}</p>}
    </div>
  );
}
