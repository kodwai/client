"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  project_id: string;
  project_title?: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  overall_score: number | null;
}

const statusVariant: Record<string, BadgeVariant> = {
  pending: "default",
  active: "success",
  completed: "info",
  expired: "warning",
  error: "error",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
  { value: "error", label: "Error" },
];

function _parseUTC(ts: string | null): Date | null {
  if (!ts) return null;
  const s = ts.endsWith("Z") || ts.includes("+") ? ts : ts.replace(" ", "T") + "Z";
  return new Date(s);
}

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  const s = _parseUTC(startedAt);
  const e = _parseUTC(endedAt);
  if (!s || !e) return "—";
  const ms = e.getTime() - s.getTime();
  if (ms < 0) return "—";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
}

function formatDate(iso: string): string {
  const d = _parseUTC(iso);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : "";
    api
      .get(`/api/sessions${query}`)
      .then((data) => setSessions(Array.isArray(data) ? data : data.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/sessions/${deleteTarget.id}`);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete session.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl">Sessions</h1>
        <div className="w-full sm:w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        All interview sessions across projects
      </p>
      <Divider className="mx-0 my-8" />

      {error && <p className="font-mono text-xs text-rust mb-4">{error}</p>}

      {sessions.length === 0 ? (
        <Card className="text-center py-16">
          <p className="font-display text-xl text-muted mb-2">No sessions found.</p>
          <p className="font-mono text-sm text-muted">
            {statusFilter
              ? "Try a different status filter."
              : "Sessions will appear here once created from a project."}
          </p>
        </Card>
      ) : (
        <>
        {/* Mobile: card layout */}
        <div className="md:hidden space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => router.push(`/sessions/${session.id}`)}
              className="border border-border bg-white/50 p-4 cursor-pointer hover:border-rust transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-display text-base">{session.candidate_name}</div>
                  <div className="font-mono text-xs text-muted">{session.candidate_email}</div>
                </div>
                <Badge variant={statusVariant[session.status] || "default"}>
                  {session.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
                  <span>{session.project_title || session.project_id}</span>
                  <span>{formatDate(session.created_at)}</span>
                  <span>{formatDuration(session.started_at, session.ended_at)}</span>
                  {session.overall_score != null && (
                    <span className="text-ink">{session.overall_score!.toFixed(1)}/10</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(session); }}
                  className="font-mono text-xs text-muted hover:text-rust transition-colors ml-2 shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-mono text-xs uppercase tracking-widest text-muted pb-3 pr-4">
                  Candidate
                </th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-muted pb-3 pr-4">
                  Project
                </th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-muted pb-3 pr-4">
                  Status
                </th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-muted pb-3 pr-4">
                  Created
                </th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-muted pb-3 pr-4">
                  Duration
                </th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-muted pb-3 pr-4">
                  Score
                </th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => router.push(`/sessions/${session.id}`)}
                  className="border-b border-border/50 cursor-pointer hover:bg-cream-dark/50 transition-colors"
                >
                  <td className="py-4 pr-4">
                    <div className="font-display text-base">{session.candidate_name}</div>
                    <div className="font-mono text-xs text-muted">{session.candidate_email}</div>
                  </td>
                  <td className="py-4 pr-4 font-mono text-sm">
                    {session.project_title || session.project_id}
                  </td>
                  <td className="py-4 pr-4">
                    <Badge variant={statusVariant[session.status] || "default"}>
                      {session.status}
                    </Badge>
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-muted">
                    {formatDate(session.created_at)}
                  </td>
                  <td className="py-4 pr-4 font-mono text-sm">
                    {formatDuration(session.started_at, session.ended_at)}
                  </td>
                  <td className="py-4 pr-4 font-mono text-sm">
                    {session.overall_score != null ? `${session.overall_score!.toFixed(1)}/10` : "—"}
                  </td>
                  <td className="py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(session); }}
                      className="font-mono text-xs text-muted hover:text-rust transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Session"
        description={`This will permanently delete the session for "${deleteTarget?.candidate_name}" and all its data. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
