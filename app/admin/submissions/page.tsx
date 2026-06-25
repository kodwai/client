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
  scored: "success", scoring: "info", submitted: "info", in_progress: "warning", error: "error",
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (agentFilter) params.set("agent_used", agentFilter);
    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/submissions?${params}`)
        .then((data) => { setSubmissions(data?.submissions || []); setTotal(data?.total || 0); })
        .catch(() => setSubmissions([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter, agentFilter]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Submissions</h1>
      <p className="text-muted font-mono text-sm mb-2">{total} total submissions</p>
      <Divider className="mx-0 my-6" />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input label="" placeholder="Search by developer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All statuses</option>
          <option value="scored">Scored</option>
          <option value="scoring">Scoring</option>
          <option value="submitted">Submitted</option>
          <option value="in_progress">In Progress</option>
          <option value="error">Error</option>
        </select>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All agents</option>
          <option value="claude-code">Claude Code</option>
          <option value="cursor">Cursor</option>
          <option value="codex">Codex</option>
        </select>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : submissions.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No submissions found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-3">Developer</span>
            <span className="col-span-2">Challenge</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1">Agent</span>
            <span className="col-span-1 text-right">Score</span>
            <span className="col-span-1 text-right">Time</span>
            <span className="col-span-1 text-right">Difficulty</span>
            <span className="col-span-2 text-right">Date</span>
          </div>
          {submissions.map((s: any) => (
            <Link key={s.id} href={`/admin/submissions/${s.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
              <div className="col-span-3">
                <p className="font-display text-sm truncate">{s.user_name}</p>
                <p className="font-mono text-[10px] text-muted truncate">@{s.username || s.user_email}</p>
              </div>
              <span className="col-span-2 font-mono text-xs text-muted self-center truncate">{s.challenge_title}</span>
              <span className="col-span-1 self-center"><Badge variant={statusVariant[s.status] || "default"}>{s.status}</Badge></span>
              <span className="col-span-1 font-mono text-[10px] text-muted self-center uppercase">{s.agent_used || "—"}</span>
              <span className="col-span-1 font-display text-sm text-right self-center">
                {s.score != null ? (
                  <span className={s.score >= 70 ? "text-green-700" : s.score >= 50 ? "text-amber-600" : "text-rust"}>{s.score.toFixed(0)}</span>
                ) : "—"}
              </span>
              <span className="col-span-1 font-mono text-xs text-muted text-right self-center">{s.time_taken_ms ? `${Math.round(s.time_taken_ms / 60000)}m` : "—"}</span>
              <span className="col-span-1 self-center text-right"><Badge variant={s.difficulty === "easy" ? "success" : s.difficulty === "hard" ? "error" : "warning"}>{s.difficulty}</Badge></span>
              <span className="col-span-2 font-mono text-[10px] text-muted text-right self-center">{formatDate(s.created_at || s.started_at)}</span>
            </Link>
          ))}
        </div></div>
      )}
    </div>
  );
}
