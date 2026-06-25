"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Usage meter for developers on the platform-funded free tier. Renders nothing
 * for company accounts, for developers who have connected their own key
 * (unlimited), or when the free tier is disabled. When credits hit zero the
 * non-dismissable gate takes over, so this only ever shows a positive count.
 */
export function FreeSubmissionsBanner() {
  const { user } = useAuth();

  if (!user || user.user_type !== "developer") return null;
  if (user.has_claude_api_key) return null;
  if (user.free_submissions_limit <= 0) return null;
  // Zero remaining is handled by the layout gate; never render a "0 left" meter.
  if (user.free_submissions_remaining <= 0) return null;

  const { free_submissions_remaining: remaining, free_submissions_limit: limit } = user;

  return (
    <div className="mb-8 p-4 border-l-2 border-rust bg-rust/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="font-mono text-sm text-ink/80">
        <span className="text-rust font-semibold">{remaining}</span> of {limit} free
        submission{limit !== 1 ? "s" : ""} left.{" "}
        <span className="text-muted">Connect your Anthropic key for unlimited submissions.</span>
      </p>
      <Link
        href="/dev/settings"
        className="font-mono text-xs uppercase tracking-widest text-rust hover:text-rust-hover transition-colors whitespace-nowrap"
      >
        Add key →
      </Link>
    </div>
  );
}
