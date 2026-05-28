"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function OnboardingClaudeKeyPage() {
  const router = useRouter();
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
      await refreshUser();
      router.replace("/dev/challenges");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your key. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = user?.name?.split(" ")[0];

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">
        {firstName ? `One last step, ${firstName}` : "One last step"}
      </h2>
      <p className="text-muted font-mono text-sm mb-8">
        Connect your Anthropic API key to unlock the platform.
      </p>

      <div className="mb-8 p-5 border border-border bg-white/50">
        <p className="font-mono text-sm text-ink/80 leading-relaxed">
          Kodwai uses Claude to review and score every challenge you submit.
          Your key stays encrypted at rest and is only used to grade your own work.
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
          {submitting ? "Validating with Anthropic..." : "Save and continue"}
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
  );
}
