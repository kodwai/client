"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTime, getTimeMs } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { ChallengeFeedbackForm } from "@/components/feedback/challenge-feedback-form";
import { ScoreCard } from "@/components/score-card";
import { isV2, type ScoreBreakdownV2 } from "@/lib/scoring";
import { ScoreBreakdownV2View } from "@/components/score-breakdown";

interface LegacyDimension { name: string; score: number; max: number; max_score?: number; detail?: string; justification?: string; }
interface LegacyBreakdownData {
  is_late?: boolean;
  late_penalty?: number;
  objective?: { total?: number; dimensions?: LegacyDimension[] };
  analytical?: { total?: number; summary?: string; dimensions?: LegacyDimension[]; strengths?: string[]; weaknesses?: string[] };
  analytical_skipped?: boolean;
}

interface Submission {
  id: string;
  challenge_id: string;
  challenge_title: string;
  challenge_slug: string;
  challenge_difficulty: string;
  challenge_time_limit_minutes: number | null;
  status: string;
  agent_used: string | null;
  score: number | null;
  score_breakdown: Record<string, unknown> | null;
  time_taken_ms: number | null;
  started_at: string;
  submitted_at: string | null;
  scored_at: string | null;
}

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  scored: "success",
  scoring: "info",
  submitted: "info",
  in_progress: "warning",
  error: "error",
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const data = await api.get(`/api/submissions/${id}`);
        setSubmission(data);
      } catch {
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    }
    let intervalId: ReturnType<typeof setInterval> | null = null;

    fetchSubmission().then(() => {
      // Only start polling if not already in a terminal state
      intervalId = setInterval(async () => {
        try {
          const data = await api.get(`/api/submissions/${id}`);
          setSubmission(data);
          if (data.status === "scored" || data.status === "error") {
            if (intervalId) clearInterval(intervalId);
          }
        } catch {
          // ignore
        }
      }, 3000);
    });

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <Card className="text-center py-12">
        <p className="font-display text-xl mb-2">Submission not found</p>
        <Link href="/dev/submissions" className="font-mono text-sm text-rust">
          &larr; Back to submissions
        </Link>
      </Card>
    );
  }

  const timeMin = submission.time_taken_ms ? Math.round(submission.time_taken_ms / 60000) : null;

  return (
    <div>
      <Link href="/dev/submissions" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">
        &larr; Back to submissions
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <h1 className="font-display text-3xl">{submission.challenge_title}</h1>
        <Badge variant={statusVariant[submission.status] || "info"}>{submission.status}</Badge>
      </div>
      <Divider className="mx-0 my-8" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Score</p>
          <p className="font-display text-2xl">
            {submission.score != null ? (
              <span className={submission.score >= 70 ? "text-green-700" : submission.score >= 50 ? "text-amber-600" : "text-rust"}>
                {submission.score.toFixed(0)}
              </span>
            ) : submission.status === "scoring" ? (
              <span className="text-muted">...</span>
            ) : (
              "—"
            )}
          </p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Time</p>
          {submission.status === "in_progress" ? (
            <LiveTimer
              startedAt={submission.started_at}
              timeLimitMinutes={submission.challenge_time_limit_minutes || 60}
            />
          ) : (
            <p className="font-display text-2xl">{timeMin != null ? `${timeMin} min` : "—"}</p>
          )}
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Agent</p>
          <p className="font-display text-xl">{submission.agent_used || "—"}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Status</p>
          <p className="font-display text-xl capitalize">{submission.status}</p>
        </Card>
      </div>

      {/* Score breakdown */}
      {submission.status === "scoring" && (
        <Card className="text-center py-8 mb-6">
          <p className="font-display text-xl mb-2">Scoring in progress...</p>
          <p className="font-mono text-sm text-muted">This usually takes a few seconds.</p>
        </Card>
      )}

      {submission.score_breakdown && (
        isV2(submission.score_breakdown) ? (
          <ScoreBreakdownV2View breakdown={submission.score_breakdown as ScoreBreakdownV2} />
        ) : (
          <LegacyBreakdown bd={submission.score_breakdown as LegacyBreakdownData} />
        )
      )}

      {/* Shareable Score Card */}
      {submission.status === "scored" && submission.score != null && (
        <div className="mb-6">
          <h2 className="font-display text-xl mb-4">Share Your Score</h2>
          {(() => {
            const bd = submission.score_breakdown;
            const v2 = isV2(bd) ? (bd as ScoreBreakdownV2) : null;
            const legacy = v2 ? null : (bd as LegacyBreakdownData | null);
            const axisScore = (name: string) => v2?.axes.find((a) => a.name === name)?.score;
            return (
              <ScoreCard
                submissionId={submission.id}
                challengeTitle={submission.challenge_title}
                challengeDifficulty={submission.challenge_difficulty}
                score={submission.score}
                objectiveScore={legacy?.objective?.total}
                analyticalScore={legacy?.analytical?.total}
                directionScore={axisScore("direction")}
                outcomeScore={axisScore("outcome")}
                liftScore={axisScore("lift")}
                agentUsed={submission.agent_used || "Unknown"}
                timeMinutes={timeMin || 0}
                timeLimitMinutes={submission.challenge_time_limit_minutes || 60}
                strengths={legacy?.analytical?.strengths}
              />
            );
          })()}
        </div>
      )}

      {/* Timestamps */}
      <Card>
        <h2 className="font-display text-lg mb-3">Timeline</h2>
        <div className="space-y-2 font-mono text-xs">
          <p><span className="text-muted w-24 inline-block">Started:</span> {formatDateTime(submission.started_at)}</p>
          {submission.submitted_at && (
            <p><span className="text-muted w-24 inline-block">Submitted:</span> {formatDateTime(submission.submitted_at)}</p>
          )}
          {submission.scored_at && (
            <p><span className="text-muted w-24 inline-block">Scored:</span> {formatDateTime(submission.scored_at)}</p>
          )}
        </div>
      </Card>

      {/* Challenge feedback — shown after scoring */}
      {submission.status === "scored" && (
        <ChallengeFeedbackForm
          challengeId={submission.challenge_id}
          submissionId={submission.id}
        />
      )}
    </div>
  );
}

function LiveTimer({ startedAt, timeLimitMinutes }: { startedAt: string; timeLimitMinutes: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startMs = getTimeMs(startedAt);
  const elapsedMs = now - startMs;
  const limitMs = timeLimitMinutes * 60 * 1000;
  const remainingMs = Math.max(0, limitMs - elapsedMs);
  const isOver = elapsedMs > limitMs;

  const totalSec = Math.floor((isOver ? elapsedMs - limitMs : remainingMs) / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const display = `${min}:${String(sec).padStart(2, "0")}`;

  const pct = Math.min((elapsedMs / limitMs) * 100, 100);

  return (
    <div>
      <p className={`font-display text-2xl ${isOver ? "text-rust" : elapsedMs > limitMs * 0.8 ? "text-amber-600" : ""}`}>
        {isOver ? `+${display}` : display}
      </p>
      <p className="font-mono text-[9px] text-muted mt-1">
        {isOver ? "over time" : "remaining"}
      </p>
      <div className="h-1 bg-border mt-2 overflow-hidden">
        <div
          className={`h-full transition-all ${isOver ? "bg-rust" : pct > 80 ? "bg-amber-500" : "bg-green-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function LegacyBreakdown({ bd }: { bd: LegacyBreakdownData }) {
  return (
    <>
      {/* Late penalty notice */}
      {bd.is_late && (
        <Card className="mb-6 border-rust/30 bg-rust/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#9202;</span>
            <div>
              <p className="font-display text-base">Late Submission</p>
              <p className="font-mono text-xs text-muted">
                Time limit exceeded — a {bd.late_penalty} point penalty was applied to your score.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Objective scoring */}
      {bd.objective && (
        <Card accent className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Objective Score</h2>
            <span className="font-mono text-sm text-muted">
              {bd.objective.total?.toFixed(1)}/85
            </span>
          </div>
          <div className="space-y-4">
            {bd.objective.dimensions?.map((dim) => (
              <div key={dim.name}>
                <ScoreBar label={dim.name} value={dim.score} max={dim.max} />
                {dim.detail && (
                  <p className="font-mono text-[10px] text-muted mt-0.5">{dim.detail}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytical scoring */}
      {bd.analytical ? (
        <Card accent className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">AI Analysis</h2>
            <span className="font-mono text-sm text-muted">
              {bd.analytical.total?.toFixed(1)}/100
            </span>
          </div>
          {bd.analytical.summary && (
            <p className="font-mono text-sm mb-4">{bd.analytical.summary}</p>
          )}
          <div className="space-y-4">
            {bd.analytical.dimensions?.map((dim) => (
              <div key={dim.name}>
                <ScoreBar label={dim.name} value={dim.score} max={dim.max_score || 10} />
                {dim.justification && (
                  <p className="font-mono text-[10px] text-muted mt-0.5">{dim.justification}</p>
                )}
              </div>
            ))}
          </div>
          {(bd.analytical.strengths ?? []).length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Strengths</p>
              <ul className="space-y-1">
                {(bd.analytical.strengths ?? []).map((s, i) => (
                  <li key={i} className="font-mono text-xs text-green-700">+ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {(bd.analytical.weaknesses ?? []).length > 0 && (
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Areas to Improve</p>
              <ul className="space-y-1">
                {(bd.analytical.weaknesses ?? []).map((w, i) => (
                  <li key={i} className="font-mono text-xs text-rust">- {w}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : bd.analytical_skipped && (
        <Card className="mb-6">
          <div className="p-3 border border-border">
            <p className="font-mono text-xs text-muted">
              AI-powered analytical scoring was skipped — add your Anthropic API key in{" "}
              <Link href="/dev/settings" className="text-rust hover:text-rust-hover transition-colors">
                Settings
              </Link>{" "}
              to unlock detailed feedback on problem solving, code quality, and agent collaboration.
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 70 ? "bg-green-600" : pct >= 50 ? "bg-amber-500" : "bg-rust";

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-mono text-xs">{label}</span>
        <span className="font-mono text-xs text-muted">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="h-2 bg-border overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
