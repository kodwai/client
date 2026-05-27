"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import type { Rubric } from "@/lib/scoring";

export function ScoringRubric({ slug }: { slug: string }) {
  const [rubric, setRubric] = useState<Rubric | null>(null);

  useEffect(() => {
    api.get(`/api/challenges/${slug}/rubric`).then(setRubric).catch(() => setRubric(null));
  }, [slug]);

  if (!rubric) return null;

  return (
    <Card className="mb-8">
      <h2 className="font-display text-xl mb-1">How you&apos;re scored</h2>
      <p className="font-mono text-xs text-muted mb-4">
        Kodwai measures how well you direct an AI — not just the final code. A lazy one-shot prompt scores low even if its tests pass.
      </p>
      <div className="space-y-5">
        {rubric.axes.map((axis) => (
          <div key={axis.name}>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-base">{axis.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{axis.points} pts</span>
            </div>
            <p className="font-mono text-[10px] text-muted mb-2">{axis.blurb}</p>
            <ul className="space-y-1">
              {axis.signals.map((s) => (
                <li key={s.name} className="font-mono text-[11px]">
                  <span className="text-ink">{s.label}</span>
                  <span className="text-muted"> — {s.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
