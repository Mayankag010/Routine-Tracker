"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import {
  exportUserDataAsJSON,
  exportUserDataAsCSV,
  clearCompletionHistory,
  deleteAllUserData,
} from "@/lib/data-management";

export function DataPrivacySettings({ user }) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [clearingOpen, setClearingOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  const [deletingOpen, setDeletingOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isPasswordAuth = user.providerData?.[0]?.providerId === "password";

  async function handleExport(format) {
    setExporting(true);
    try {
      if (format === "json") await exportUserDataAsJSON(user.uid);
      else await exportUserDataAsCSV(user.uid);
    } finally {
      setExporting(false);
    }
  }

  async function handleClearHistory() {
    setClearing(true);
    setClearError("");
    try {
      await clearCompletionHistory(user.uid);
      setClearingOpen(false);
    } catch {
      setClearError("Unable to clear history. Please try again.");
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      if (isPasswordAuth) {
        if (!password) {
          setDeleteError("Enter your password to confirm.");
          setDeleting(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await deleteAllUserData(user.uid);
      await deleteUser(auth.currentUser);
      router.replace("/login");
    } catch (err) {
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setDeleteError("Incorrect password.");
      } else if (err?.code === "auth/requires-recent-login") {
        setDeleteError("Please log out and log back in, then try again.");
      } else {
        setDeleteError("Unable to delete account. Please try again.");
      }
      setDeleting(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Data & Privacy</h2>

      <div className="mb-8">
        <p className="text-sm text-ink mb-1">Export my data</p>
        <p className="text-xs text-inkSoft mb-3">
          Download your routines, schedules, completion history, streak history, and
          preferences.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-paperDark transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export as JSON"}
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-paperDark transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export as CSV"}
          </button>
        </div>
      </div>

      <div className="mb-10">
        <p className="text-sm text-ink mb-1">Clear completion history</p>
        <p className="text-xs text-inkSoft mb-3">
          Removes your historical completion records without deleting your routines.
        </p>
        <button
          onClick={() => setClearingOpen(true)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-paperDark transition-colors"
        >
          Clear History
        </button>
      </div>

      <div className="rounded-xl border border-red-200 px-5 py-5">
        <p className="text-sm text-red-700 font-medium mb-1">Danger Zone</p>
        <p className="text-xs text-inkSoft mb-3">
          Permanently delete your account and all associated data. This can't be undone.
        </p>
        <button
          onClick={() => setDeletingOpen(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
        >
          Delete Account
        </button>
      </div>

      {clearingOpen && (
        <ConfirmDialog
          title="Clear completion history?"
          description="This will remove your historical completion records and may reset streaks and analytics."
          confirmLabel="Clear History"
          confirming={clearing}
          onConfirm={handleClearHistory}
          onCancel={() => setClearingOpen(false)}
        >
          {clearError && <p className="text-sm text-red-700">{clearError}</p>}
        </ConfirmDialog>
      )}

      {deletingOpen && (
        <ConfirmDialog
          title="Delete account?"
          description="This permanently deletes your account and all associated data — routines, completion history, reminders, and preferences."
          confirmLabel="Delete Account"
          confirming={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setDeletingOpen(false)}
        >
          {isPasswordAuth && (
            <input
              type="password"
              placeholder="Confirm your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink focus:border-accent mb-2"
            />
          )}
          {deleteError && <p className="text-sm text-red-700">{deleteError}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
