"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  project_id: string;
  project_title?: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  overall_score: number | null;
  time_limit_minutes: number | null;
}

const statusVariant: Record<string, BadgeVariant> = {
  pending: "default",
  active: "success",
  completed: "success",
  expired: "warning",
  error: "error",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get(`/api/sessions/${sessionId}`)
      .then((data) => setSession(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  function copyCommand() {
    const command = `npx kodwai start ${sessionId}`;
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
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
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-display text-3xl">{session.candidate_name}</h1>
          <p className="font-mono text-sm text-muted mt-1">{session.candidate_email}</p>
        </div>
        <Badge variant={statusVariant[session.status] || "default"}>
          {session.status}
        </Badge>
      </div>
      <Divider className="mx-0 my-8" />

      {error && <p className="font-mono text-xs text-rust mb-4">{error}</p>}

      <div className="space-y-6 max-w-3xl">
        {/* Session Details */}
        <Card accent>
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-4">
            Session Details
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                Project
              </span>
              <span className="font-display text-base">
                {session.project_title || session.project_id}
              </span>
            </div>
            <div>
              <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                Created
              </span>
              <span className="font-display text-base">{formatDate(session.created_at)}</span>
            </div>
            <div>
              <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                Started
              </span>
              <span className="font-display text-base">{formatDate(session.started_at)}</span>
            </div>
            <div>
              <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                Completed
              </span>
              <span className="font-display text-base">{formatDate(session.completed_at)}</span>
            </div>
            <div>
              <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                Duration
              </span>
              <span className="font-display text-base">
                {formatDuration(session.duration_seconds)}
              </span>
            </div>
            <div>
              <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                Score
              </span>
              <span className="font-display text-base">
                {session.overall_score !== null ? `${session.overall_score}%` : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* CLI Command for pending sessions */}
        {session.status === "pending" && (
          <Card>
            <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
              Start Session
            </label>
            <p className="text-sm text-muted mb-4">
              Share this command with the candidate to start the interview session:
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-cream-dark border border-border px-4 py-3 font-mono text-sm text-ink">
                npx kodwai start {sessionId}
              </code>
              <Button variant="secondary" onClick={copyCommand}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </Card>
        )}

        {/* Live Transcript Placeholder */}
        <Card>
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
            Live Transcript
          </label>
          <div className="py-8 text-center">
            <p className="font-mono text-sm text-muted">
              Live transcript will be available in a future update.
            </p>
            <p className="font-mono text-xs text-muted/60 mt-2">Coming in Sprint 4-5</p>
          </div>
        </Card>

        {/* Score Placeholder */}
        <Card>
          <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
            Score Breakdown
          </label>
          <div className="py-8 text-center">
            <p className="font-mono text-sm text-muted">
              Detailed scoring will be available in a future update.
            </p>
            <p className="font-mono text-xs text-muted/60 mt-2">Coming in Sprint 4-5</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
