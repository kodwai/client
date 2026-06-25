"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDate, formatDateTime } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import ReactMarkdown from "react-markdown";

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  completed: "success", active: "info", pending: "warning", expired: "error", error: "error",
};

export default function AdminProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get(`/api/admin/projects/${projectId}`)
      .then(setProject).catch(() => setProject(null)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;
  if (!project) return <Card className="text-center py-12"><p className="font-display text-xl">Project not found</p></Card>;

  return (
    <div>
      <Link href="/admin/projects" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">&larr; Back to projects</Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="font-display text-3xl">{project.title}</h1>
          <p className="text-muted font-mono text-sm">
            <Link href={`/admin/organizations/${project.organization_id}`} className="text-rust hover:text-rust-hover transition-colors">{project.org_name}</Link>
            {project.is_archived && <span className="ml-2 text-muted">(archived)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.difficulty === "easy" ? "success" : project.difficulty === "hard" ? "error" : "warning"}>{project.difficulty || "—"}</Badge>
          <span className="font-mono text-xs text-muted">{project.time_limit_minutes}m limit</span>
        </div>
      </div>
      <Divider className="mx-0 my-6" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Sessions</p><p className="font-display text-2xl">{project.session_count || 0}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Time Limit</p><p className="font-display text-2xl">{project.time_limit_minutes}m</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Budget</p><p className="font-display text-xl">{project.max_budget_usd ? `$${project.max_budget_usd}` : "—"}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Created</p><p className="font-mono text-xs">{formatDate(project.created_at)}</p></Card>
      </div>

      {/* Description */}
      {project.description && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-2">Description</h2>
          <p className="font-mono text-sm text-muted">{project.description}</p>
        </Card>
      )}

      {/* Problem Statement */}
      {project.problem_statement_md && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-3">Problem Statement</h2>
          <div className="prose prose-sm max-w-none font-mono text-xs">
            <ReactMarkdown>{project.problem_statement_md}</ReactMarkdown>
          </div>
        </Card>
      )}

      {/* Rubric */}
      {project.rubric?.length > 0 && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-3">Rubric</h2>
          <div className="space-y-2">
            {project.rubric.map((r: any, i: number) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-display text-sm">{r.name || r.dimension}</p>
                  {r.description && <p className="font-mono text-[10px] text-muted">{r.description}</p>}
                </div>
                <span className="font-mono text-xs text-muted shrink-0 ml-4">weight: {r.weight}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sessions */}
      {project.sessions?.length > 0 && (
        <div>
          <h2 className="font-display text-lg mb-3">Sessions</h2>
          <div className="admin-table-scroll"><div className="border border-border">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span className="col-span-3">Candidate</span>
              <span className="col-span-3">Email</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2 text-right">Score</span>
              <span className="col-span-2 text-right">Date</span>
            </div>
            {project.sessions.map((s: any) => (
              <Link key={s.id} href={`/admin/sessions/${s.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
                <span className="col-span-3 font-display text-sm truncate self-center">{s.candidate_name}</span>
                <span className="col-span-3 font-mono text-xs text-muted self-center truncate">{s.candidate_email}</span>
                <span className="col-span-2 self-center"><Badge variant={statusVariant[s.status] || "default"}>{s.status}</Badge></span>
                <span className="col-span-2 font-display text-sm text-right self-center">
                  {s.ai_score != null ? <span className={s.ai_score >= 7 ? "text-green-700" : s.ai_score >= 5 ? "text-amber-600" : "text-rust"}>{s.ai_score.toFixed(1)}</span> : "—"}
                </span>
                <span className="col-span-2 font-mono text-[10px] text-muted text-right self-center">{formatDate(s.started_at || s.created_at)}</span>
              </Link>
            ))}
          </div></div>
        </div>
      )}
    </div>
  );
}
