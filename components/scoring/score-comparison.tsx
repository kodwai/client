"use client";

import { Card } from "@/components/ui/card";

interface DimensionScore {
  name: string;
  score: number;
}

interface Score {
  dimensions: DimensionScore[];
  overall_score: number;
  summary?: string;
}

interface ScoreComparisonProps {
  scores: {
    ai?: Score;
    manual?: Score;
  };
}

function diffColor(diff: number): string {
  if (Math.abs(diff) > 2) return "bg-amber-100";
  return "";
}

function ScoreComparison({ scores }: ScoreComparisonProps) {
  const { ai, manual } = scores;
  if (!ai || !manual) return null;

  // Merge dimension names from both
  const allDimensions = new Map<string, { ai?: number; manual?: number }>();
  ai.dimensions.forEach((d) => {
    allDimensions.set(d.name, { ai: d.score });
  });
  manual.dimensions.forEach((d) => {
    const existing = allDimensions.get(d.name) || {};
    allDimensions.set(d.name, { ...existing, manual: d.score });
  });

  const overallDiff = ai.overall_score - manual.overall_score;

  return (
    <Card>
      <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-6">
        Score Comparison
      </label>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-mono text-xs uppercase tracking-widest text-muted py-2 pr-4">
                Dimension
              </th>
              <th className="text-center font-mono text-xs uppercase tracking-widest text-muted py-2 px-4">
                AI
              </th>
              <th className="text-center font-mono text-xs uppercase tracking-widest text-muted py-2 px-4">
                Manual
              </th>
              <th className="text-center font-mono text-xs uppercase tracking-widest text-muted py-2 pl-4">
                Diff
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Overall row */}
            <tr className={`border-b border-border font-display ${diffColor(overallDiff)}`}>
              <td className="py-3 pr-4 font-display text-base">Overall</td>
              <td className="py-3 px-4 text-center font-display text-lg">
                {ai.overall_score.toFixed(1)}
              </td>
              <td className="py-3 px-4 text-center font-display text-lg">
                {manual.overall_score.toFixed(1)}
              </td>
              <td className="py-3 pl-4 text-center font-mono text-xs">
                <span className={Math.abs(overallDiff) > 2 ? "text-rust font-bold" : "text-muted"}>
                  {overallDiff > 0 ? "+" : ""}
                  {overallDiff.toFixed(1)}
                </span>
              </td>
            </tr>

            {/* Dimension rows */}
            {Array.from(allDimensions.entries()).map(([name, vals]) => {
              const diff = (vals.ai || 0) - (vals.manual || 0);
              return (
                <tr key={name} className={`border-b border-border ${diffColor(diff)}`}>
                  <td className="py-2.5 pr-4 font-mono text-xs uppercase tracking-widest">
                    {name}
                  </td>
                  <td className="py-2.5 px-4 text-center font-display text-sm">
                    {vals.ai !== undefined ? vals.ai.toFixed(1) : "\u2014"}
                  </td>
                  <td className="py-2.5 px-4 text-center font-display text-sm">
                    {vals.manual !== undefined ? vals.manual.toFixed(1) : "\u2014"}
                  </td>
                  <td className="py-2.5 pl-4 text-center font-mono text-xs">
                    <span className={Math.abs(diff) > 2 ? "text-rust font-bold" : "text-muted"}>
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export { ScoreComparison };
export type { ScoreComparisonProps, Score };
