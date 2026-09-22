"use client";

import { FormEvent, useState } from "react";
import posthog from "posthog-js";
import { api, isExpectedClientError } from "@/lib/api";

/**
 * "Resend verification email" action. The endpoint always answers 204 (it never
 * reveals whether an account exists) and rate-limits on the server, so the
 * confirmation copy stays neutral. Without a known email it asks for one.
 */
export function ResendVerification({ email: knownEmail }: { email?: string }) {
  const [typedEmail, setTypedEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const email = (knownEmail ?? typedEmail).trim();

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const target = email;
    if (!target) return;
    setState("sending");
    try {
      await api.post("/api/auth/resend-verification", { email: target });
      posthog.capture("verification_email_resent");
      setState("sent");
    } catch (err) {
      if (!isExpectedClientError(err)) posthog.captureException(err);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="font-mono text-xs text-muted">
        If that account still needs verifying, a new link is on its way. Check your spam folder too.
      </p>
    );
  }

  const button = (
    <button
      type="submit"
      disabled={state === "sending" || !email}
      className="font-mono text-xs uppercase tracking-widest text-rust hover:text-rust-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === "sending" ? "Sending..." : "Resend verification email"}
    </button>
  );

  return (
    <form onSubmit={send} className="space-y-2">
      {!knownEmail && (
        <input
          type="email"
          required
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email"
          className="w-full border-b-2 border-border bg-transparent py-2 font-display text-lg text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-rust"
        />
      )}
      {button}
      {state === "error" && (
        <p className="font-mono text-xs text-rust">Couldn&apos;t send it right now. Try again in a few minutes.</p>
      )}
    </form>
  );
}
