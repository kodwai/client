"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { ScoringRubric } from "@/components/scoring-rubric";

interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  category: string;
  tags: string[];
  time_limit_minutes: number;
  is_featured: boolean;
  submission_count: number;
  avg_score: number | null;
}

const difficultyVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const data = await api.get(`/api/challenges/${slug}`);
        setChallenge(data);
      } catch {
        setChallenge(null);
      } finally {
        setLoading(false);
      }
    }
    fetchChallenge();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <Card className="text-center py-12">
        <p className="font-display text-xl mb-2">Challenge not found</p>
        <Link href="/dev/challenges" className="font-mono text-sm text-rust hover:text-rust-hover transition-colors">
          &larr; Back to challenges
        </Link>
      </Card>
    );
  }

  const cliCommand = `npx @kodwai/cli challenge ${challenge.slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <Link
        href="/dev/challenges"
        className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block"
      >
        &larr; Back to challenges
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <h1 className="font-display text-3xl">{challenge.title}</h1>
        <div className="flex items-center gap-2">
          <Badge variant={difficultyVariant[challenge.difficulty] || "info"}>
            {challenge.difficulty}
          </Badge>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {challenge.category}
          </span>
        </div>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{challenge.description}</p>
      <Divider className="mx-0 my-8" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Time Limit</p>
          <p className="font-display text-xl">{challenge.time_limit_minutes} min</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Submissions</p>
          <p className="font-display text-xl">{challenge.submission_count}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Avg Score</p>
          <p className="font-display text-xl">{challenge.avg_score != null ? challenge.avg_score.toFixed(0) : "—"}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Tags</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {challenge.tags.map((tag) => (
              <span key={tag} className="font-mono text-[10px] px-1.5 py-0.5 border border-border text-muted">
                {tag}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <ScoringRubric slug={challenge.slug} />

      {/* Start Challenge */}
      <Card accent>
        <h2 className="font-display text-xl mb-2">Start this challenge</h2>
        <p className="font-mono text-xs text-muted mb-4">
          Run this command in your terminal. You&apos;ll be asked to choose your AI agent (Claude Code or Cursor),
          then the problem statement and starter files will be downloaded to your machine.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-ink/5 border border-border px-4 py-3 font-mono text-sm overflow-x-auto">
            {cliCommand}
          </code>
          <button
            onClick={handleCopy}
            className="px-4 py-3 border border-border font-mono text-xs uppercase tracking-widest text-muted hover:text-ink hover:border-rust/50 transition-colors shrink-0"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </Card>

      {/* Note about problem statement */}
      <p className="font-mono text-xs text-muted mt-6 text-center">
        The full problem statement is revealed after you start the challenge via the CLI.
      </p>

      {/* My submissions for this challenge */}
      <MySubmissions challengeId={challenge.id} />

      {/* Challenge leaderboard */}
      <ChallengeLeaderboard challengeId={challenge.id} />
    </div>
  );
}

function MySubmissions({ challengeId }: { challengeId: string }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/submissions/me?challenge_id=${challengeId}`)
      .then((data) => {
        setSubmissions(data || []);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [challengeId]);

  if (loading) return null;
  if (submissions.length === 0) return null;

  const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
    scored: "success",
    scoring: "info",
    submitted: "info",
    in_progress: "warning",
    error: "error",
  };

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl mb-4">My Submissions</h2>
      <div className="space-y-3">
        {submissions.map((s: any) => (
          <Link key={s.id} href={`/dev/submissions/${s.id}`}>
            <Card className="hover:border-rust/30 transition-colors cursor-pointer mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant[s.status] || "info"}>{s.status}</Badge>
                  {s.score_breakdown?.is_late && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rust">late (-{s.score_breakdown.late_penalty}pts)</span>
                  )}
                  {s.agent_used && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.agent_used}</span>
                  )}
                  {s.time_taken_ms && (
                    <span className="font-mono text-xs text-muted">{Math.round(s.time_taken_ms / 60000)} min</span>
                  )}
                  <span className="font-mono text-xs text-muted">
                    {formatDate(s.created_at)}
                  </span>
                </div>
                {s.score != null ? (
                  <span className={`font-display text-xl ${s.score >= 70 ? "text-green-700" : s.score >= 50 ? "text-amber-600" : "text-rust"}`}>
                    {s.score.toFixed(0)}
                  </span>
                ) : (
                  <span className="font-mono text-sm text-muted">—</span>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ChallengeLeaderboard({ challengeId }: { challengeId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/leaderboard/challenges/${challengeId}?limit=10`)
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [challengeId]);

  if (loading) return null;
  if (entries.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-xl mb-4">Top Scores</h2>
      <div className="border border-border">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-white/30">
          <span className="col-span-1 font-mono text-[10px] uppercase tracking-widest text-muted">#</span>
          <span className="col-span-5 font-mono text-[10px] uppercase tracking-widest text-muted">Developer</span>
          <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Score</span>
          <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Time</span>
          <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Agent</span>
        </div>
        {entries.map((e: any, i: number) => (
          <div key={e.id} className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border last:border-b-0">
            <span className="col-span-1 flex items-center">
              {i < 3 ? (
                <img src={`/badges/rank-${i + 1}.png`} alt={`Rank ${i + 1}`} className="w-6 h-6 object-contain" />
              ) : (
                <span className="font-mono text-xs text-muted">{i + 1}</span>
              )}
            </span>
            <span className="col-span-5 font-display text-sm">{e.name || e.username}</span>
            <span className="col-span-2 font-display text-sm text-right">{e.score?.toFixed(0)}</span>
            <span className="col-span-2 font-mono text-xs text-muted text-right">
              {e.time_taken_ms ? `${Math.round(e.time_taken_ms / 60000)}m` : "—"}
            </span>
            <span className="col-span-2 font-mono text-[10px] text-muted text-right uppercase">{e.agent_used || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
