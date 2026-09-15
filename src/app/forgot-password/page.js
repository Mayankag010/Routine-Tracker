"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { friendlyAuthError } from "@/lib/auth-errors";
import { AuthCard, AuthInput, AuthButton, AuthError } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
    >
      {sent ? (
        <p className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
          Check your inbox at {email} for a reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <AuthError message={error} />
          <AuthInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthButton type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </AuthButton>
        </form>
      )}
      <p className="mt-6 text-sm text-inkSoft">
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
