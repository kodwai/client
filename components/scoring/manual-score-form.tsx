"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RubricDimension {
  name: string;
  weight: number;
  description: string;
}

interface DimensionScore {
  name: string;
  score: number;
}

interface ManualScore {
  dimensions: DimensionScore[];
  overall_score: number;
  summary: string;
}

interface ManualScoreFormProps {
  rubric: RubricDimension[];
  onSubmit: (score: ManualScore) => void;
  existingScore?: ManualScore;
  submitting?: boolean;
}

function ManualScoreForm({ rubric, onSubmit, existingScore, submitting }: ManualScoreFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [overrideOverall, setOverrideOverall] = useState<number | null>(null);
  const [summary, setSummary] = useState("");

  // Pre-fill from existing score
  useEffect(() => {
    if (existingScore) {
      const initial: Record<string, number> = {};
      existingScore.dimensions.forEach((d) => {
        initial[d.name] = d.score;
      });
      setScores(initial);
      setSummary(existingScore.summary || "");
      setOverrideOverall(null);
    } else {
      const initial: Record<string, number> = {};
      rubric.forEach((r) => {
        initial[r.name] = 5;
      });
      setScores(initial);
    }
  }, [existingScore, rubric]);

  const weightedAverage = useMemo(() => {
    const totalWeight = rubric.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = rubric.reduce(
      (sum, r) => sum + (scores[r.name] || 0) * r.weight,
      0
    );
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }, [scores, rubric]);

  const overallScore = overrideOverall !== null ? overrideOverall : weightedAverage;

  function updateScore(name: string, value: number) {
    setScores((prev) => ({ ...prev, [name]: value }));
    setOverrideOverall(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      dimensions: rubric.map((r) => ({
        name: r.name,
        score: scores[r.name] || 0,
      })),
      overall_score: overallScore,
      summary,
    });
  }

  return (
    <Card>
      <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-6">
        Manual Score
      </label>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Score */}
        <div className="text-center pb-4 border-b border-border">
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
            Overall Score
          </label>
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={overallScore}
              onChange={(e) => setOverrideOverall(parseFloat(e.target.value) || 0)}
              className="w-24 text-center font-display text-4xl bg-transparent border-b-2 border-border focus:border-rust outline-none"
            />
            <span className="font-mono text-sm text-muted">/10</span>
          </div>
          {overrideOverall !== null && (
            <button
              type="button"
              className="mt-1 font-mono text-[10px] text-muted underline"
              onClick={() => setOverrideOverall(null)}
            >
              Reset to weighted avg ({weightedAverage})
            </button>
          )}
        </div>

        {/* Dimension Scores */}
        <div className="space-y-5">
          {rubric.map((dim) => (
            <div key={dim.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs uppercase tracking-widest text-ink">
                  {dim.name}
                </span>
                <span className="font-display text-sm text-ink">
                  {(scores[dim.name] || 0).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted mb-2">{dim.description}</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={scores[dim.name] || 0}
                  onChange={(e) => updateScore(dim.name, parseFloat(e.target.value))}
                  className="flex-1 accent-rust h-1.5 cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={scores[dim.name] || 0}
                  onChange={(e) => updateScore(dim.name, parseFloat(e.target.value) || 0)}
                  className="w-16 text-center font-mono text-xs bg-transparent border border-border px-2 py-1 focus:border-rust outline-none"
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="font-mono text-[10px] text-muted">0</span>
                <span className="font-mono text-[10px] text-muted">
                  weight: {dim.weight}
                </span>
                <span className="font-mono text-[10px] text-muted">10</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
            Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Overall assessment notes..."
            className="w-full border border-border bg-transparent p-3 font-mono text-sm text-ink outline-none focus:border-rust resize-y placeholder:text-muted/50"
          />
        </div>

        {/* Submit */}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : existingScore ? "Update Manual Score" : "Save Manual Score"}
        </Button>
      </form>
    </Card>
  );
}

export { ManualScoreForm };
export type { RubricDimension, ManualScore, DimensionScore };
