"use client";

import { useEffect, useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface SessionStatsProps {
  session: {
    started_at: string | null;
    ended_at?: string | null;
    time_limit_minutes: number | null;
    status: string;
  };
  eventCount: number;
  fileCount: number;
}

const statusVariant: Record<string, BadgeVariant> = {
  pending: "default",
  active: "success",
  completed: "info",
  expired: "warning",
  error: "error",
};

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionStats({ session, eventCount, fileCount }: SessionStatsProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session.started_at) return;

    const start = new Date(session.started_at).getTime();

    // For completed sessions, compute final elapsed from ended_at
    if (session.status !== "active") {
      if (session.ended_at) {
        const end = new Date(session.ended_at).getTime();
        setElapsed(Math.floor((end - start) / 1000));
      }
      return;
    }

    function tick() {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.started_at, session.ended_at, session.status]);

  const totalSeconds = (session.time_limit_minutes || 0) * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progressPct = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;

  const promptCount = eventCount;

  return (
    <div className="flex items-center gap-3 sm:gap-6 flex-wrap py-3 px-4 sm:py-4 sm:px-6 bg-white/50 border border-border">
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Status
        </span>
        <Badge variant={statusVariant[session.status] || "default"}>
          {session.status}
        </Badge>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Time
        </span>
        <span className="font-mono text-sm text-ink">
          {formatElapsed(elapsed)}
          {totalSeconds > 0 && (
            <span className="text-muted"> / {formatElapsed(totalSeconds)}</span>
          )}
        </span>
        {totalSeconds > 0 && session.status === "active" && (
          <div className="w-24 h-1.5 bg-cream-dark overflow-hidden">
            <div
              className="h-full bg-rust transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Remaining */}
      {totalSeconds > 0 && session.status === "active" && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Remaining
          </span>
          <span
            className={`font-mono text-sm ${
              remaining < 300 ? "text-rust" : "text-ink"
            }`}
          >
            {formatElapsed(remaining)}
          </span>
        </div>
      )}

      {/* Events */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Events
        </span>
        <span className="font-mono text-sm text-ink">{promptCount}</span>
      </div>

      {/* Files */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Files
        </span>
        <span className="font-mono text-sm text-ink">{fileCount}</span>
      </div>
    </div>
  );
}
