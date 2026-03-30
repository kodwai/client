"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { AiScoreCard } from "@/components/scoring/ai-score-card";
import type { AiScoreData } from "@/components/scoring/ai-score-card";
import { ManualScoreForm } from "@/components/scoring/manual-score-form";
import type { ManualScore, RubricDimension } from "@/components/scoring/manual-score-form";
import { ScoreComparison } from "@/components/scoring/score-comparison";
import { CommentSection } from "@/components/scoring/comment-section";

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  project_id: string;
  project_title?: string;
  status: string;
}

interface ScoresResponse {
  ai_score?: AiScoreData;
  manual_score?: ManualScore;
}

interface Project {
  id: string;
  title: string;
  rubric?: RubricDimension[];
}

const defaultRubric: RubricDimension[] = [
  { name: "Code Quality", weight: 1, description: "Clean, readable, maintainable code" },
  { name: "Problem Solving", weight: 1, description: "Approach and solution effectiveness" },
  { name: "Communication", weight: 1, description: "Clarity of thought process and explanations" },
  { name: "Completeness", weight: 1, description: "Requirements coverage and edge cases" },
  { name: "Efficiency", weight: 1, description: "Performance and resource usage" },
];

export default function ScorePage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [scores, setScores] = useState<ScoresResponse>({});
  const [rubric, setRubric] = useState<RubricDimension[]>(defaultRubric);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [sessionData, scoresData] = await Promise.all([
          api.get(`/api/sessions/${sessionId}`),
          api.get(`/api/sessions/${sessionId}/scores`).catch(() => ({})),
        ]);

        setSession(sessionData);

        // API returns array of scores — split into ai/manual
        const scoresList = Array.isArray(scoresData) ? scoresData : [];
        const aiScore = scoresList.find((s: { score_type: string }) => s.score_type === "ai");
        const manualScore = scoresList.find((s: { score_type: string }) => s.score_type === "manual");
        setScores({ ai_score: aiScore, manual_score: manualScore });

        // Load project rubric
        if (sessionData.project_id) {
          try {
            const project: Project = await api.get(
              `/api/projects/${sessionData.project_id}`
            );
            if (project.rubric && project.rubric.length > 0) {
              setRubric(project.rubric);
            }
          } catch {
            // Use default rubric
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  async function handleManualScoreSubmit(score: ManualScore) {
    setSubmitting(true);
    try {
      await api.post(`/api/sessions/${sessionId}/scores`, score);
      const updated = await api.get(`/api/sessions/${sessionId}/scores`);
      const list = Array.isArray(updated) ? updated : [];
      setScores({
        ai_score: list.find((s: { score_type: string }) => s.score_type === "ai"),
        manual_score: list.find((s: { score_type: string }) => s.score_type === "manual"),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save score");
    } finally {
      setSubmitting(false);
    }
  }

  function exportReport() {
    if (!session) return;

    const lines: string[] = [];
    lines.push(`# Score Report: ${session.candidate_name}`);
    lines.push(`**Email:** ${session.candidate_email}`);
    lines.push(`**Project:** ${session.project_title || session.project_id}`);
    lines.push(`**Session:** ${sessionId}`);
    lines.push("");

    if (scores.ai_score) {
      lines.push("## AI Score");
      lines.push(`**Overall:** ${scores.ai_score.overall_score.toFixed(1)}/10`);
      lines.push("");
      lines.push("### Dimensions");
      scores.ai_score.dimensions.forEach((d) => {
        lines.push(`- **${d.name}:** ${d.score.toFixed(1)}/10`);
        if (d.justification) lines.push(`  - ${d.justification}`);
      });
      lines.push("");
      lines.push(`**Summary:** ${scores.ai_score.summary}`);
      lines.push("");
      if (scores.ai_score.strengths.length > 0) {
        lines.push("### Strengths");
        scores.ai_score.strengths.forEach((s) => lines.push(`- ${s}`));
        lines.push("");
      }
      if (scores.ai_score.weaknesses.length > 0) {
        lines.push("### Weaknesses");
        scores.ai_score.weaknesses.forEach((w) => lines.push(`- ${w}`));
        lines.push("");
      }
    }

    if (scores.manual_score) {
      lines.push("## Manual Score");
      lines.push(`**Overall:** ${scores.manual_score.overall_score.toFixed(1)}/10`);
      lines.push("");
      lines.push("### Dimensions");
      scores.manual_score.dimensions.forEach((d) => {
        lines.push(`- **${d.name}:** ${d.score.toFixed(1)}/10`);
      });
      lines.push("");
      if (scores.manual_score.summary) {
        lines.push(`**Summary:** ${scores.manual_score.summary}`);
        lines.push("");
      }
    }

    lines.push(`---`);
    lines.push(`*Generated by Kodwai on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*`);

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `score-report-${session.candidate_name.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">
          Loading scores...
        </p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-rust">{error}</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
        <div>
          <Link
            href={`/sessions/${sessionId}`}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
          >
            &larr; Back to Session
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl mt-2">
            Scores &mdash; {session.candidate_name}
          </h1>
          <p className="font-mono text-sm text-muted mt-1">
            {session.project_title || session.project_id}
          </p>
        </div>
        <Button variant="secondary" onClick={exportReport}>
          Export Report
        </Button>
      </div>
      <Divider className="mx-0 my-8" />

      {error && <p className="font-mono text-xs text-rust mb-4">{error}</p>}

      <div className="space-y-8">
        {/* Score Comparison (if both exist) */}
        {scores.ai_score && scores.manual_score && (
          <ScoreComparison
            scores={{
              ai: {
                dimensions: scores.ai_score.dimensions,
                overall_score: scores.ai_score.overall_score,
              },
              manual: {
                dimensions: scores.manual_score.dimensions,
                overall_score: scores.manual_score.overall_score,
              },
            }}
          />
        )}

        {/* AI Score */}
        {scores.ai_score && <AiScoreCard score={scores.ai_score} />}

        {/* No AI score yet */}
        {!scores.ai_score && (
          <Card>
            <p className="text-sm text-muted text-center py-4">
              AI score has not been generated yet.
            </p>
          </Card>
        )}

        {/* Manual Score Form */}
        <ManualScoreForm
          rubric={rubric}
          onSubmit={handleManualScoreSubmit}
          existingScore={scores.manual_score}
          submitting={submitting}
        />

        {/* Comments */}
        <CommentSection sessionId={sessionId} />
      </div>
    </div>
  );
}
