"use client";

import { Card } from "@/components/ui/card";

export function ScoringRubric() {
  return (
    <Card className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h2 className="font-display text-xl">How you&apos;re scored</h2>
      </div>
      <p className="font-mono text-xs text-muted">
        Kodwai measures how well you direct an AI, not just the final code. To keep every assessment fair and
        impossible to game, the detailed scoring rubric is kept private from candidates. Focus on directing the
        AI clearly, reasoning through trade-offs, and shipping clean, working solutions. Do that well and the
        score will follow.
      </p>
    </Card>
  );
}
