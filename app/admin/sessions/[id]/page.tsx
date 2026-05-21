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
import { Modal } from "@/components/ui/modal";

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  completed: "success", active: "info", pending: "warning", expired: "error", error: "error",
};

export default function AdminSessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [endModal, setEndModal] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    adminApi.get(`/api/admin/sessions/${sessionId}`)
      .then(setSession).catch(() => setSession(null)).finally(() => setLoading(false));
  }, [sessionId]);

  async function handleEnd() {
    setEnding(true);
    try {
      await adminApi.post(`/api/admin/sessions/${sessionId}/end`, {});
      setSession((prev: any) => prev ? { ...prev, status: "expired", end_reason: "admin_terminated" } : prev);
      setEndModal(false);
    } catch { /* ignore */ }
    finally { setEnding(false); }
  }

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;
  if (!session) return <Card className="text-center py-12"><p className="font-display text-xl">Session not found</p></Card>;

  return (
    <div>
      <Link href="/admin/sessions" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">&larr; Back</Link>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-display text-3xl">{session.candidate_name}</h1>
        <Badge variant={statusVariant[session.status] || "default"}>{session.status}</Badge>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{session.candidate_email} — {session.project_title} ({session.org_name})</p>
      <Divider className="mx-0 my-6" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Status</p><p className="font-display text-xl capitalize">{session.status}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Events</p><p className="font-display text-xl">{session.event_count || 0}</p></Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Cost</p>
          <p className="font-display text-xl">{session.total_cost_usd ? `$${session.total_cost_usd.toFixed(4)}` : "—"}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Duration</p>
          <p className="font-display text-xl">{(() => {
            if (session.duration_ms) return `${Math.round(session.duration_ms / 60000)}m`;
            if (session.started_at && session.ended_at) {
              const _p = (t: string) => new Date(t.endsWith?.("Z") ? t : t.replace(" ", "T") + "Z").getTime();
              const ms = _p(session.ended_at) - _p(session.started_at);
              return ms > 0 ? `${Math.round(ms / 60000)}m` : "—";
            }
            return "—";
          })()}</p>
        </Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Tokens</p><p className="font-display text-xl">{session.total_tokens || "—"}</p></Card>
      </div>

      {/* Timeline */}
      <Card className="mb-6">
        <h2 className="font-display text-lg mb-3">Timeline</h2>
        <div className="space-y-1 font-mono text-xs">
          <p><span className="text-muted inline-block w-20">Created:</span> {formatDateTime(session.created_at)}</p>
          {session.started_at && <p><span className="text-muted inline-block w-20">Started:</span> {formatDateTime(session.started_at)}</p>}
          {session.ended_at && <p><span className="text-muted inline-block w-20">Ended:</span> {formatDateTime(session.ended_at)}</p>}
          {session.end_reason && <p><span className="text-muted inline-block w-20">Reason:</span> {session.end_reason}</p>}
        </div>
      </Card>

      {/* Scores */}
      {session.scores?.length > 0 && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-3">Scores</h2>
          {session.scores.map((sc: any, i: number) => (
            <div key={i} className="mb-4 last:mb-0 p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={sc.score_type === "ai" ? "info" : "default"}>{sc.score_type} score</Badge>
                <span className="font-display text-2xl">{sc.overall_score?.toFixed(1)}<span className="text-muted text-sm">/10</span></span>
              </div>
              {sc.summary && <p className="font-mono text-xs mb-3">{sc.summary}</p>}
              {sc.dimensions?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {sc.dimensions.map((d: any, j: number) => (
                    <div key={j}>
                      <div className="flex justify-between mb-0.5">
                        <span className="font-mono text-xs">{d.name || d.dimension}</span>
                        <span className="font-mono text-xs text-muted">{d.score}/{d.max_score || d.maxScore || 10}</span>
                      </div>
                      <div className="h-1.5 bg-border"><div className="h-full bg-rust/60" style={{ width: `${((d.score || 0) / (d.max_score || d.maxScore || 10)) * 100}%` }} /></div>
                      {d.justification && <p className="font-mono text-[10px] text-muted mt-0.5">{d.justification}</p>}
                    </div>
                  ))}
                </div>
              )}
              {sc.strengths?.length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Strengths</p>
                  {sc.strengths.map((s: string, j: number) => <p key={j} className="font-mono text-xs text-green-700">+ {s}</p>)}
                </div>
              )}
              {sc.weaknesses?.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Weaknesses</p>
                  {sc.weaknesses.map((w: string, j: number) => <p key={j} className="font-mono text-xs text-rust">- {w}</p>)}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Files */}
      {session.final_files?.length > 0 && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-3">Files ({session.final_files.length} final, {session.file_change_count} changes)</h2>
          <div className="space-y-1">
            {session.final_files.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-border last:border-b-0">
                <span className="font-mono text-xs">{f.file_path}</span>
                <span className="font-mono text-[10px] text-muted">{f.size ? `${(f.size / 1024).toFixed(1)} KB` : "—"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      {(session.status === "active" || session.status === "pending") && (
        <Card accent>
          <h2 className="font-display text-lg mb-3">Actions</h2>
          <Button variant="secondary" onClick={() => setEndModal(true)}>End Session</Button>
        </Card>
      )}

      <Modal
        open={endModal}
        onClose={() => setEndModal(false)}
        title="End Session"
        description={`Force-end this session for ${session.candidate_name}? It will be marked as expired.`}
        confirmLabel="End Session"
        onConfirm={handleEnd}
        loading={ending}
      />
    </div>
  );
}
