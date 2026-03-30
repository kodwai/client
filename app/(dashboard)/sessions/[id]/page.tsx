"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSessionEvents, type SessionEvent } from "@/hooks/use-session-events";
import { Card } from "@/components/ui/card";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { SessionStats } from "@/components/session/session-stats";
import { LiveTranscript } from "@/components/session/live-transcript";
import { FileExplorer } from "@/components/session/file-explorer";
import { ToolFeed } from "@/components/session/tool-feed";

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  project_id: string;
  project_title?: string;
  status: string;
  session_token?: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  total_cost_usd: number | null;
  time_limit_minutes: number | null;
}

const statusVariant: Record<string, BadgeVariant> = {
  pending: "default",
  active: "success",
  completed: "info",
  expired: "warning",
  error: "error",
};

function formatDate(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "\u2014";
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
  const [aiScore, setAiScore] = useState<number | null>(null);

  const isLive = session?.status === "active";
  const isCompleted = session?.status === "completed";
  const showDashboard = isLive || isCompleted;

  // Poll events every 3s for active sessions, load once for completed
  const { events } = useSessionEvents(
    showDashboard ? sessionId : null,
    isLive ? 3000 : 0,
  );

  // Fetch AI score for completed sessions
  useEffect(() => {
    if (!isCompleted) return;
    api
      .get(`/api/sessions/${sessionId}/scores`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const ai = list.find((s: { score_type: string }) => s.score_type === "ai");
        if (ai?.overall_score != null) setAiScore(ai.overall_score);
      })
      .catch(() => {});
  }, [sessionId, isCompleted]);

  // Load session (also poll for active to detect status changes)
  useEffect(() => {
    api
      .get(`/api/sessions/${sessionId}`)
      .then((data) => setSession(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (!isLive) return;
    const interval = setInterval(() => {
      api.get(`/api/sessions/${sessionId}`).then((data) => setSession(data)).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, isLive]);

  // Derived counts for stats
  const fileCount = useMemo(
    () =>
      new Set(
        events
          .filter(
            (e) =>
              e.type === "file.change" ||
              e.type === "file_change" ||
              e.type === "file.write" ||
              e.type === "file.create"
          )
          .map(
            (e) =>
              (e.data.file_path as string) || (e.data.path as string) || ""
          )
          .filter(Boolean)
      ).size,
    [events]
  );

  function copyCommand() {
    const command = `npx @kodwai/cli start ${sessionId} --token ${session?.session_token || ""}`;
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">
          Loading...
        </p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{session.candidate_name}</h1>
          <p className="font-mono text-sm text-muted mt-1">
            {session.candidate_email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${
            isLive ? "text-green-700" : session.status === "completed" ? "text-blue-700" : "text-muted"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isLive ? "bg-green-500 animate-pulse" : session.status === "completed" ? "bg-blue-500" : session.status === "expired" ? "bg-amber-500" : session.status === "error" ? "bg-rust" : "bg-muted"
            }`} />
            {session.status}
          </span>
        </div>
      </div>
      <Divider className="mx-0 my-8" />

      {error && (
        <p className="font-mono text-xs text-rust mb-4">{error}</p>
      )}

      {/* Pending: show CLI command + session details */}
      {session.status === "pending" && (
        <div className="space-y-6 max-w-3xl">
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
                <span className="font-display text-base">
                  {formatDate(session.created_at)}
                </span>
              </div>
              <div>
                <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                  Time Limit
                </span>
                <span className="font-display text-base">
                  {session.time_limit_minutes
                    ? `${session.time_limit_minutes} min`
                    : "\u2014"}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
              Start Session
            </label>
            <p className="text-sm text-muted mb-4">
              Share this command with the candidate to start the interview
              session:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <code className="flex-1 bg-cream-dark border border-border px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm text-ink break-all">
                npx @kodwai/cli start {sessionId} --token {session?.session_token}
              </code>
              <Button variant="secondary" onClick={copyCommand}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Active / Completed: live dashboard */}
      {showDashboard && (
        <div className="space-y-6">
          {/* Session summary at top for completed, stats bar for active */}
          {isCompleted ? (
            <Card accent>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-4">
                Session Summary
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
                    Started
                  </span>
                  <span className="font-display text-base">
                    {formatDate(session.started_at)}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                    Completed
                  </span>
                  <span className="font-display text-base">
                    {formatDate(session.ended_at)}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                    Duration
                  </span>
                  <span className="font-display text-base">
                    {session.started_at && session.ended_at
                      ? (() => {
                          const ms = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
                          const mins = Math.floor(ms / 60000);
                          const secs = Math.floor((ms % 60000) / 1000);
                          return `${mins}m ${secs}s`;
                        })()
                      : "\u2014"}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                    Events
                  </span>
                  <span className="font-display text-base">
                    {events.length}
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-xs text-muted uppercase tracking-widest">
                    Score
                  </span>
                  <span className="font-display text-base">
                    {aiScore != null ? `${aiScore.toFixed(1)}/10` : "\u2014"}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href={`/sessions/${sessionId}/score`}
                  className="inline-block px-6 py-3 bg-rust text-cream font-mono text-xs uppercase tracking-widest transition-colors hover:bg-rust-hover"
                >
                  View Scores
                </Link>
              </div>
            </Card>
          ) : (
            <SessionStats
              session={{
                started_at: session.started_at,
                ended_at: session.ended_at,
                time_limit_minutes: session.time_limit_minutes,
                status: session.status,
              }}
              eventCount={events.length}
              fileCount={fileCount}
            />
          )}

          {/* Vertically stacked sections */}
          <div className="space-y-6">
            <Card>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
                Live Transcript
              </label>
              <LiveTranscript events={events} />
            </Card>

            <Card>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
                File Changes
              </label>
              <FileExplorer events={events} />
            </Card>

            <Card>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
                Tool Usage
              </label>
              <ToolFeed events={events} />
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
