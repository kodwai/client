"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div>
        <h2 className="font-display text-3xl mb-2">Check your inbox</h2>
        <p className="text-muted font-mono text-sm mb-8">
          If an account exists for {email}, we sent a password reset link.
          The link expires in 1 hour.
        </p>

        <div className="p-5 border border-border bg-white/50">
          <p className="font-mono text-sm text-ink/80 leading-relaxed">
            Didn&apos;t get the email? Check your spam folder, or
            {" "}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-rust hover:text-rust-hover transition-colors"
            >
              try a different address
            </button>
            .
          </p>
        </div>

        <p className="mt-8 text-center font-mono text-xs text-muted">
          <Link href="/login" className="text-rust hover:text-rust-hover transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Reset your password</h2>
      <p className="text-muted font-mono text-sm mb-8">
        Enter the email on your account and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="mb-6 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-8 text-center font-mono text-xs text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-rust hover:text-rust-hover transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
