"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

export default function WelcomePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to kodwai",
      content: (
        <div>
          <p className="font-mono text-sm text-muted mb-4">
            kodwai is where developers prove their AI-agent coding skills.
            Solve challenges using Claude Code or Cursor, get scored, and climb the leaderboard.
          </p>
          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="text-center p-4 border border-border">
              <p className="font-display text-2xl mb-1">1</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Pick a challenge</p>
            </div>
            <div className="text-center p-4 border border-border">
              <p className="font-display text-2xl mb-1">2</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Solve with AI</p>
            </div>
            <div className="text-center p-4 border border-border">
              <p className="font-display text-2xl mb-1">3</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Get scored</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How it works",
      content: (
        <div className="font-mono text-sm space-y-4">
          <div className="p-4 border-l-2 border-rust bg-rust/5">
            <p className="font-display text-base mb-1">Run the CLI</p>
            <code className="text-xs text-muted">npx @kodwai/cli challenge build-rest-api</code>
          </div>
          <div className="p-4 border-l-2 border-border">
            <p className="font-display text-base mb-1">Choose your agent</p>
            <p className="text-xs text-muted">Claude Code or Cursor — you pick, we trace</p>
          </div>
          <div className="p-4 border-l-2 border-border">
            <p className="font-display text-base mb-1">Code your solution</p>
            <p className="text-xs text-muted">Work naturally with your AI agent in your own environment</p>
          </div>
          <div className="p-4 border-l-2 border-border">
            <p className="font-display text-base mb-1">Submit</p>
            <code className="text-xs text-muted">npx @kodwai/cli submit</code>
          </div>
        </div>
      ),
    },
    {
      title: "Add your API key (optional)",
      content: (
        <div>
          <p className="font-mono text-sm text-muted mb-4">
            Adding your Anthropic API key unlocks AI-powered analytical scoring —
            detailed feedback on your problem-solving, code quality, and agent collaboration.
          </p>
          <p className="font-mono text-sm text-muted mb-6">
            Without a key, you still get objective scoring (tests, code quality, time).
            You can add it anytime in Settings.
          </p>
          <Link href="/dev/settings">
            <Button variant="secondary">Add API Key</Button>
          </Link>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="font-display text-3xl mb-1">
        {step === 0 ? `Hey ${user?.name?.split(" ")[0] || "there"}` : steps[step].title}
      </h1>
      {step === 0 && (
        <p className="text-muted font-mono text-sm mb-2">Let&apos;s get you set up</p>
      )}
      <Divider className="mx-0 my-6" />

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 transition-colors ${i <= step ? "bg-rust" : "bg-border"}`}
          />
        ))}
      </div>

      <Card accent className="mb-6">
        {step === 0 && <h2 className="font-display text-xl mb-4">{steps[step].title}</h2>}
        {steps[step].content}
      </Card>

      <div className="flex justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="font-mono text-xs text-muted hover:text-ink transition-colors"
          >
            &larr; Back
          </button>
        ) : (
          <div />
        )}
        {isLast ? (
          <Link href="/dev/challenges">
            <Button>Browse Challenges</Button>
          </Link>
        ) : (
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
}
