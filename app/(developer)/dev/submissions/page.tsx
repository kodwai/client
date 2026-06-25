"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { ActiveChallengeBanner } from "@/components/active-challenge-banner";

interface Submission {
  id: string;
  challenge_title: string;
  challenge_slug: string;
  challenge_difficulty: string;
  status: string;
  agent_used: string | null;
  score: number | null;
  score_breakdown: { is_late?: boolean; late_penalty?: number } | null;
  time_taken_ms: number | null;
  created_at: string;
}

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  scored: "success",
  scoring: "info",
  submitted: "info",
  in_progress: "warning",
  error: "error",
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/submissions/me")
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">My Submissions</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Track your challenge attempts and scores
      </p>
      <Divider className="mx-0 my-8" />

      <ActiveChallengeBanner />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
        </div>
      ) : submissions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No submissions yet</p>
          <p className="font-mono text-sm text-muted mb-4">
            Complete a challenge to see your submissions here.
          </p>
          <Link href="/dev/challenges" className="font-mono text-sm text-rust hover:text-rust-hover transition-colors">
            Browse challenges &rarr;
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <Link key={s.id} href={`/dev/submissions/${s.id}`}>
              <Card className="hover:border-rust/30 transition-colors cursor-pointer mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-display text-lg">{s.challenge_title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant={statusVariant[s.status] || "info"}>{s.status}</Badge>
                      {s.score_breakdown?.is_late && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
                          late (-{s.score_breakdown.late_penalty}pts)
                        </span>
                      )}
                      {s.agent_used && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {s.agent_used}
                        </span>
                      )}
                      {s.time_taken_ms && (
                        <span className="font-mono text-xs text-muted">
                          {Math.round(s.time_taken_ms / 60000)} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {s.score != null ? (
                      <p className="font-display text-2xl">
                        <span className={s.score >= 70 ? "text-green-700" : s.score >= 50 ? "text-amber-600" : "text-rust"}>
                          {s.score.toFixed(0)}
                        </span>
                        <span className="text-muted font-mono text-sm">/100</span>
                      </p>
                    ) : (
                      <p className="font-mono text-sm text-muted">—</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
