import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Dimension {
  name: string;
  score: number;
  weight?: number;
  justification?: string;
}

interface AiScoreData {
  dimensions: Dimension[];
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

interface AiScoreCardProps {
  score: AiScoreData;
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-700";
  if (score >= 6) return "text-amber-600";
  return "text-rust";
}

function barColor(score: number): string {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-amber-400";
  return "bg-rust";
}

function AiScoreCard({ score }: AiScoreCardProps) {
  return (
    <Card accent>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <label className="block font-mono text-xs uppercase tracking-widest text-muted">
          AI Score
        </label>
        <Badge variant="default">AI Generated</Badge>
      </div>

      {/* Overall Score */}
      <div className="text-center mb-8">
        <span className={`font-display text-5xl ${scoreColor(score.overall_score)}`}>
          {score.overall_score.toFixed(1)}
        </span>
        <span className="font-mono text-sm text-muted ml-1">/10</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-ink/80 mb-6 leading-relaxed">{score.summary}</p>

      {/* Dimension Breakdown */}
      <div className="mb-6">
        <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
          Dimensions
        </label>
        <div className="space-y-3">
          {score.dimensions.map((dim) => (
            <div key={dim.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs uppercase tracking-widest text-ink">
                  {dim.name}
                </span>
                <span className={`font-display text-sm ${scoreColor(dim.score)}`}>
                  {dim.score.toFixed(1)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-cream-dark rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor(dim.score)}`}
                  style={{ width: `${(dim.score / 10) * 100}%` }}
                />
              </div>
              {dim.justification && (
                <p className="mt-2 ml-1 text-xs text-muted leading-relaxed border-l-2 border-border pl-3">
                  {dim.justification}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
            Strengths
          </label>
          <ul className="space-y-1.5">
            {score.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
            Weaknesses
          </label>
          <ul className="space-y-1.5">
            {score.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rust shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export { AiScoreCard };
export type { AiScoreData, Dimension };
