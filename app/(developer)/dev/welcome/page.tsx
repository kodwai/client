"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

export default function WelcomePage() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);

  // Mark the intro as seen on view so it only ever auto-shows once. Best-effort:
  // if it fails the developer can still continue, and it retries on next visit.
  useEffect(() => {
    let cancelled = false;
    api
      .post("/api/auth/me/welcome", {})
      .then(() => {
        if (!cancelled) refreshUser();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const freeLimit = user?.free_submissions_limit ?? 0;

  const steps = [
    {
      title: "Welcome to kodwai",
      content: (
        <div>
          <p className="font-mono text-sm sm:text-base text-muted leading-relaxed mb-6 sm:mb-8">
            kodwai is where developers prove their AI-agent coding skills.
            Solve challenges using Claude Code, Cursor, or Codex, get scored, and climb the leaderboard.
          </p>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {[
              { n: 1, label: "Pick a challenge" },
              { n: 2, label: "Solve with AI" },
              { n: 3, label: "Get scored" },
            ].map(({ n, label }) => (
              <div key={n} className="text-center p-3 sm:p-6 border border-border">
                <p className="font-display text-2xl sm:text-4xl mb-1.5 sm:mb-2">{n}</p>
                <p className="font-mono text-[9px] sm:text-[11px] uppercase tracking-wide sm:tracking-widest text-muted leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "How it works",
      content: (
        <div className="font-mono space-y-3 sm:space-y-4">
          <div className="p-4 sm:p-5 border-l-2 border-rust bg-rust/5">
            <p className="font-display text-base sm:text-lg mb-1">Run the CLI</p>
            <code className="text-xs sm:text-sm text-muted break-all">npx @kodwai/cli challenge bookshelf-rest-api</code>
          </div>
          <div className="p-4 sm:p-5 border-l-2 border-border">
            <p className="font-display text-base sm:text-lg mb-1">Choose your agent</p>
            <p className="text-xs sm:text-sm text-muted">Claude Code, Cursor, or Codex — you pick, we trace</p>
          </div>
          <div className="p-4 sm:p-5 border-l-2 border-border">
            <p className="font-display text-base sm:text-lg mb-1">Code your solution</p>
            <p className="text-xs sm:text-sm text-muted">Work naturally with your AI agent in your own environment</p>
          </div>
          <div className="p-4 sm:p-5 border-l-2 border-border">
            <p className="font-display text-base sm:text-lg mb-1">Submit</p>
            <code className="text-xs sm:text-sm text-muted break-all">npx @kodwai/cli submit</code>
          </div>
        </div>
      ),
    },
    {
      title: "Your free submissions",
      content: (
        <div>
          <p className="font-mono text-sm sm:text-base text-muted leading-relaxed mb-4">
            {freeLimit > 0 ? (
              <>
                Your first{" "}
                <span className="text-rust font-bold">{freeLimit}</span>{" "}
                submission{freeLimit === 1 ? "" : "s"} {freeLimit === 1 ? "is" : "are"} on us,
                scored end to end with Claude: detailed feedback on your problem-solving,
                code quality, and agent collaboration.
              </>
            ) : (
              <>
                Every submission is scored end to end with Claude: detailed feedback on your
                problem-solving, code quality, and agent collaboration.
              </>
            )}
          </p>
          <p className="font-mono text-sm sm:text-base text-muted leading-relaxed">
            {freeLimit > 0
              ? "When they run out, connect your own Anthropic API key for unlimited submissions. You can add it anytime in Settings. It stays encrypted and only scores your own work."
              : "Connect your own Anthropic API key for unlimited submissions. You can add it anytime in Settings. It stays encrypted and only scores your own work."}
          </p>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-5 sm:px-6 pt-16 sm:pt-[12vh] pb-16">
      <div className="w-full max-w-2xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-2">
          {step === 0 ? `Hey ${firstName}` : steps[step].title}
        </h2>
        {step === 0 && (
          <p className="text-muted font-mono text-sm sm:text-base mb-2">Let&apos;s get you set up</p>
        )}

        <Divider className="mx-0 my-6 sm:my-8" />

        {/* Progress dots */}
        <div className="flex gap-2 mb-6 sm:mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 transition-colors ${i <= step ? "bg-rust" : "bg-border"}`}
            />
          ))}
        </div>

        <Card accent className="mb-6 sm:mb-8">
          {step === 0 && <h3 className="font-display text-xl sm:text-2xl mb-4 sm:mb-5">{steps[step].title}</h3>}
          {steps[step].content}
        </Card>

        <div className="flex justify-between items-center">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}
          {isLast ? (
            <Link href="/dev/challenges">
              <Button className="text-sm px-6 sm:px-8 py-3.5">Browse Challenges</Button>
            </Link>
          ) : (
            <Button className="text-sm px-6 sm:px-8 py-3.5" onClick={() => setStep(step + 1)}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}
