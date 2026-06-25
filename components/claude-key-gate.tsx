"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

/**
 * Full-screen, non-dismissable gate shown to a developer once their free
 * submissions are spent and they have not connected their own Anthropic key.
 * There is intentionally no close button, overlay-click, or Escape handler:
 * the only ways past it are connecting a key or signing out.
 */
export function ClaudeKeyGate() {
  const { user, logout, refreshUser } = useAuth();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError("Anthropic keys start with sk-ant-. Double-check the key you pasted.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/api-keys", { key: trimmed, label: "Default" });
      // Reconnecting the key flips can_submit back to true and dismisses the gate.
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your key. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = user?.name?.split(" ")[0];
  const used = user?.free_submissions_used ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream px-4 overflow-y-auto">
      <div className="w-full max-w-[520px] py-12">
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
          <div className="h-px bg-rust mt-4 w-12 mx-auto" />
        </div>

        <h2 className="font-display text-3xl mb-2">
          {firstName ? `You're out of free submissions, ${firstName}` : "You're out of free submissions"}
        </h2>
        <p className="text-muted font-mono text-sm mb-8">
          {used > 0
            ? `You've used all ${used} of your free submissions. Connect your Anthropic API key to keep going.`
            : "Connect your Anthropic API key to start submitting challenges."}
        </p>

        <div className="mb-8 p-5 border border-border bg-white/50">
          <p className="font-mono text-sm text-ink/80 leading-relaxed">
            Kodwai uses Claude to review and score every challenge you submit.
            Connecting your own key keeps the platform free and unlimited: your key
            stays encrypted at rest and is only ever used to grade your own work.
          </p>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 font-mono text-xs uppercase tracking-widest text-rust hover:text-rust-hover transition-colors"
          >
            Get a key at console.anthropic.com →
          </a>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Anthropic API key"
            type="password"
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            autoFocus
            required
            className="font-mono"
          />

          <Button type="submit" disabled={submitting || !key.trim()} className="w-full">
            {submitting ? "Validating with Anthropic..." : "Connect key and continue"}
          </Button>
        </form>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={logout}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
