"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { Divider } from "@/components/ui/divider";

// Catches unexpected render and data errors, for example the API being
// unreachable while a public share card or profile is server-rendered.
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] text-center">
        <p style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</p>
        <Divider className="mt-4 mb-12" />

        <h1 className="font-display text-3xl sm:text-4xl mb-3">Something went wrong</h1>
        <p className="font-mono text-sm text-muted mb-10">
          We couldn&apos;t load this page. It&apos;s usually temporary, so try again in a moment.
        </p>

        <button
          type="button"
          onClick={() => unstable_retry()}
          className="px-6 py-3 bg-rust text-cream hover:bg-rust-hover font-mono text-xs uppercase tracking-widest transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
