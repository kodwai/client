"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  completed: "success", active: "info", pending: "warning", expired: "error", error: "error",
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/sessions?${params}`)
        .then((data) => { setSessions(data?.sessions || []); setTotal(data?.total || 0); })
        .catch(() => setSessions([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Sessions</h1>
      <p className="text-muted font-mono text-sm mb-2">{total} total interview sessions</p>
      <Divider className="mx-0 my-6" />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input label="" placeholder="Search by candidate..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="error">Error</option>
        </select>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No sessions found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-2">Candidate</span>
            <span className="col-span-2">Project</span>
            <span className="col-span-2">Organization</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1 text-right">Score</span>
            <span className="col-span-1 text-right">Duration</span>
            <span className="col-span-1 text-right">Cost</span>
            <span className="col-span-2 text-right">Created</span>
          </div>
          {sessions.map((s: any) => {
            // Calculate duration from timestamps if duration_ms is null
            let durationStr = "—";
            if (s.duration_ms) {
              durationStr = `${Math.round(s.duration_ms / 60000)}m`;
            } else if (s.started_at && s.ended_at) {
              const _p = (t: string) => new Date(t.endsWith("Z") ? t : t.replace(" ", "T") + "Z").getTime();
              const ms = _p(s.ended_at) - _p(s.started_at);
              if (ms > 0) durationStr = `${Math.round(ms / 60000)}m`;
            }
            return (
            <Link key={s.id} href={`/admin/sessions/${s.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
              <div className="col-span-2">
                <p className="font-display text-sm truncate">{s.candidate_name}</p>
                <p className="font-mono text-[10px] text-muted truncate">{s.candidate_email}</p>
              </div>
              <span className="col-span-2 font-mono text-xs text-muted self-center truncate">{s.project_title}</span>
              <span className="col-span-2 font-mono text-xs text-muted self-center truncate">{s.org_name}</span>
              <span className="col-span-1 self-center"><Badge variant={statusVariant[s.status] || "default"}>{s.status}</Badge></span>
              <span className="col-span-1 font-display text-sm text-right self-center">
                {s.ai_score != null ? <span className={s.ai_score >= 7 ? "text-green-700" : s.ai_score >= 5 ? "text-amber-600" : "text-rust"}>{s.ai_score.toFixed(1)}</span> : "—"}
              </span>
              <span className="col-span-1 font-mono text-xs text-muted text-right self-center">{durationStr}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right self-center">{s.total_cost_usd ? `$${s.total_cost_usd.toFixed(2)}` : "—"}</span>
              <span className="col-span-2 font-mono text-[10px] text-muted text-right self-center">{formatDate(s.created_at)}</span>
            </Link>
            );
          })}
        </div></div>
      )}
    </div>
  );
}
