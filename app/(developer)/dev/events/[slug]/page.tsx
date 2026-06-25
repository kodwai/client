"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { formatDateTime } from "@/lib/date";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "active" | "ended";
  is_finalized: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  username: string;
  score: number;
  agent_used: string | null;
  scored_at: string;
}

const statusVariant: Record<Event["status"], "success" | "info" | "default"> = {
  active: "success",
  upcoming: "info",
  ended: "default",
};

const podiumLabel: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span className="font-display text-base">{podiumLabel[rank]}</span>
    );
  }
  return <span className="font-mono text-sm text-muted">#{rank}</span>;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventData, leaderboardData] = await Promise.all([
          api.get(`/api/events/${slug}`),
          api.get(`/api/events/${slug}/leaderboard`),
        ]);
        setEvent(eventData);
        setEntries(leaderboardData || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <Link
          href="/dev/events"
          className="font-mono text-xs text-muted hover:text-rust transition-colors uppercase tracking-widest"
        >
          ← Events
        </Link>
        <Card className="text-center py-12 mt-8">
          <p className="font-display text-xl mb-2">Event not found</p>
          <p className="font-mono text-sm text-muted">
            This event may have been removed or the link is incorrect.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dev/events"
        className="font-mono text-xs text-muted hover:text-rust transition-colors uppercase tracking-widest"
      >
        ← Events
      </Link>

      <div className="mt-6 mb-1 flex items-start justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl">{event.title}</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
          {event.is_finalized && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
              Finalized
            </span>
          )}
        </div>
      </div>

      <p className="text-muted font-mono text-sm mb-2">{event.description}</p>

      <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
        <span>From {formatDateTime(event.starts_at)}</span>
        <span>To {formatDateTime(event.ends_at)}</span>
      </div>

      {event.is_finalized && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border bg-amber-50 font-mono text-xs uppercase tracking-widest text-amber-800 mb-4">
          🏆 Final results
        </div>
      )}

      <Divider className="mx-0 my-8" />

      <h2 className="font-display text-xl mb-6">Leaderboard</h2>

      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No entries yet</p>
          <p className="font-mono text-sm text-muted">
            {event.status === "upcoming"
              ? "The event hasn't started yet."
              : "Be the first to submit a solution."}
          </p>
        </Card>
      ) : (
        <div>
          {/* Desktop table */}
          <div className="hidden sm:block border border-border">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border bg-white/30">
              <span className="col-span-1 font-mono text-[10px] uppercase tracking-widest text-muted">Rank</span>
              <span className="col-span-5 font-mono text-[10px] uppercase tracking-widest text-muted">Developer</span>
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Score</span>
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Agent</span>
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Scored at</span>
            </div>
            {entries.map((entry) => {
              const isPodium = event.is_finalized && entry.rank <= 3;
              return (
                <Link
                  href={`/developers/${entry.username}`}
                  key={entry.user_id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer ${
                    isPodium ? "bg-amber-50/60" : ""
                  }`}
                >
                  <span className="col-span-1 flex items-center">
                    <RankCell rank={entry.rank} />
                  </span>
                  <div className="col-span-5">
                    <p className="font-display text-sm">{entry.name}</p>
                    <p className="font-mono text-xs text-muted">@{entry.username}</p>
                  </div>
                  <span className="col-span-2 font-display text-sm text-right">
                    {entry.score?.toFixed(0) ?? "—"}
                  </span>
                  <span className="col-span-2 font-mono text-[10px] text-muted text-right uppercase">
                    {entry.agent_used || "—"}
                  </span>
                  <span className="col-span-2 font-mono text-[10px] text-muted text-right">
                    {formatDateTime(entry.scored_at)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {entries.map((entry) => {
              const isPodium = event.is_finalized && entry.rank <= 3;
              return (
                <Link href={`/developers/${entry.username}`} key={entry.user_id}>
                  <div
                    className={`border border-border p-4 hover:border-rust/30 transition-colors ${
                      isPodium ? "bg-amber-50/60 border-amber-200" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <RankCell rank={entry.rank} />
                        <div>
                          <p className="font-display text-sm">{entry.name}</p>
                          <p className="font-mono text-xs text-muted">@{entry.username}</p>
                        </div>
                      </div>
                      <p className="font-display text-xl">{entry.score?.toFixed(0) ?? "—"}</p>
                    </div>
                    <div className="flex gap-4 font-mono text-[10px] text-muted uppercase tracking-widest">
                      <span>{entry.agent_used || "—"}</span>
                      <span>{formatDateTime(entry.scored_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
