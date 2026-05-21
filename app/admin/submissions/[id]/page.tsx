"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  scored: "success", scoring: "info", submitted: "info", in_progress: "warning", error: "error",
};

export default function AdminSubmissionDetailPage() {
  const params = useParams();
  const subId = params.id as string;
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);

  function fetchSub() {
    adminApi.get(`/api/admin/submissions/${subId}`)
      .then(setSub).catch(() => setSub(null)).finally(() => setLoading(false));
  }

  useEffect(() => { fetchSub(); }, [subId]);

  async function handleRescore() {
    setRescoring(true);
    try {
      await adminApi.post(`/api/admin/submissions/${subId}/rescore`, {});
      // Poll for completion
      const poll = setInterval(async () => {
        const data = await adminApi.get(`/api/admin/submissions/${subId}`);
        setSub(data);
        if (data.status === "scored" || data.status === "error") {
          clearInterval(poll);
          setRescoring(false);
        }
      }, 2000);
    } catch {
      setRescoring(false);
    }
  }

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;
  if (!sub) return <Card className="text-center py-12"><p className="font-display text-xl">Submission not found</p></Card>;

  return (
    <div>
      <Link href="/admin/submissions" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">&larr; Back</Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl">{sub.challenge_title}</h1>
          <Badge variant={statusVariant[sub.status] || "default"}>{sub.status}</Badge>
        </div>
        <Button variant="secondary" onClick={handleRescore} disabled={rescoring || sub.status === "scoring"}>
          {rescoring || sub.status === "scoring" ? "Re-scoring..." : "Re-score"}
        </Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        by {sub.user_name} (@{sub.username || sub.user_email}) — {sub.difficulty} — {sub.agent_used || "no agent"}
      </p>
      <Divider className="mx-0 my-6" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Score</p>
          <p className="font-display text-2xl">
            {sub.score != null ? (
              <span className={sub.score >= 70 ? "text-green-700" : sub.score >= 50 ? "text-amber-600" : "text-rust"}>{sub.score.toFixed(1)}</span>
            ) : "—"}
          </p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Time</p>
          <p className="font-display text-xl">{sub.time_taken_ms ? `${Math.round(sub.time_taken_ms / 60000)}m` : "—"}</p>
          {sub.time_limit_minutes && <p className="font-mono text-[10px] text-muted">of {sub.time_limit_minutes}m limit</p>}
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Files</p>
          <p className="font-display text-xl">{sub.file_count || 0}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Agent Trace</p>
          <p className="font-display text-xl">{sub.has_agent_trace ? "Yes" : "No"}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Agent</p>
          <p className="font-display text-lg uppercase">{sub.agent_used || "—"}</p>
        </Card>
      </div>

      {/* Score breakdown */}
      {sub.score_breakdown && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-3">Score Breakdown</h2>

          {sub.score_breakdown.is_late && (
            <div className="mb-3 p-2 border border-rust/30 bg-rust/5 font-mono text-xs text-rust">
              Late submission — {sub.score_breakdown.late_penalty} point penalty applied
            </div>
          )}

          {sub.score_breakdown.objective?.dimensions && (
            <div className="mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Objective ({sub.score_breakdown.objective.total?.toFixed(1)})</p>
              <div className="space-y-2">
                {sub.score_breakdown.objective.dimensions.map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="font-mono text-xs">{d.name}</span>
                    <span className="font-mono text-xs text-muted">{d.score?.toFixed(1)}/{d.max} — {d.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sub.score_breakdown.analytical ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Analytical ({sub.score_breakdown.analytical.total?.toFixed(1)})</p>
              {sub.score_breakdown.analytical.summary && <p className="font-mono text-xs mb-2">{sub.score_breakdown.analytical.summary}</p>}
              {sub.score_breakdown.analytical.dimensions?.map((d: any) => (
                <div key={d.name} className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs">{d.name}</span>
                  <span className="font-mono text-xs text-muted">{d.score}/{d.max_score}</span>
                </div>
              ))}
            </div>
          ) : sub.score_breakdown.analytical_skipped && (
            <p className="font-mono text-xs text-muted">Analytical scoring skipped — developer has no API key</p>
          )}
        </Card>
      )}

      {/* Test results */}
      {sub.test_results && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-3">Test Results</h2>
          <p className="font-mono text-sm">{sub.test_results.passed}/{sub.test_results.total} passed</p>
          {sub.test_results.output && (
            <pre className="mt-2 p-2 bg-ink/5 border border-border font-mono text-xs overflow-x-auto max-h-40">{sub.test_results.output}</pre>
          )}
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <h2 className="font-display text-lg mb-3">Timeline</h2>
        <div className="space-y-1 font-mono text-xs">
          <p><span className="text-muted inline-block w-20">Started:</span> {formatDateTime(sub.started_at)}</p>
          {sub.submitted_at && <p><span className="text-muted inline-block w-20">Submitted:</span> {formatDateTime(sub.submitted_at)}</p>}
          {sub.scored_at && <p><span className="text-muted inline-block w-20">Scored:</span> {formatDateTime(sub.scored_at)}</p>}
        </div>
      </Card>
    </div>
  );
}
