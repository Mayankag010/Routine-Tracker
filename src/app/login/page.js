"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { friendlyAuthError } from "@/lib/auth-errors";
import { AuthCard, AuthInput, AuthButton, AuthError } from "@/components/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to keep your streak going.">
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
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end mb-6 -mt-2">
          <Link href="/forgot-password" className="text-sm text-inkSoft hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <AuthButton type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </AuthButton>
      </form>
      <p className="mt-6 text-sm text-inkSoft">
        No account yet?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
