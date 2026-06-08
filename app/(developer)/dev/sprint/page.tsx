"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useFeatureFlags } from "@/lib/feature-flags";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { SprintCountdown } from "@/components/sprint-countdown";

interface SprintData {
  week_key: string;
  starts_at: string;
  ends_at: string;
  challenge: {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    category: string;
    tags: string[];
    time_limit_minutes: number;
    is_featured: boolean;
    submission_count: number;
    avg_score: number | null;
  };
  leaderboard: {
    rank: number;
    user_id: string;
    name: string | null;
    username: string | null;
    score: number;
    agent_used: string | null;
    scored_at: string;
  }[];
  me: {
    rank: number | null;
    best_score: number | null;
    participated: boolean;
  };
}

const difficultyVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export default function SprintPage() {
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const [data, setData] = useState<SprintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/sprint/current")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Weekly Sprint</h1>
      <p className="text-muted font-mono text-sm">One challenge. One week. Climb the board.</p>
      <Divider className="mx-0 my-8" />

      {!flagsLoading && !isEnabled("weekly_sprint") ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">Weekly Sprint is unavailable</p>
          <p className="font-mono text-sm text-muted">This feature is currently turned off.</p>
        </Card>
      ) : loading ? (
        <p className="font-mono text-sm text-muted">Loading…</p>
      ) : !data ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">Sprint unavailable</p>
          <p className="font-mono text-sm text-muted">Check back soon.</p>
        </Card>
      ) : (
        <>
          <Card className="mb-8 border-rust/30">
            <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
              ⚡ This Week&apos;s Sprint
            </span>
            <h2 className="font-display text-2xl mt-2 mb-3">{data.challenge.title}</h2>
            <div className="flex items-center gap-2">
              <Badge variant={difficultyVariant[data.challenge.difficulty] || "info"}>
                {data.challenge.difficulty}
              </Badge>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {data.challenge.category}
              </span>
              <span className="font-mono text-xs text-muted">
                {data.challenge.time_limit_minutes} min
              </span>
            </div>
            <p className="font-mono text-sm text-muted mt-3">
              Ends in <SprintCountdown endsAt={data.ends_at} className="text-rust" />
            </p>
            <Link
              href={`/dev/challenges/${data.challenge.slug}`}
              className="font-mono text-sm text-rust hover:text-rust-hover transition-colors"
            >
              Start sprint challenge →
            </Link>
            {data.me.participated && (
              <p className="font-mono text-sm text-green-600 mt-2">
                Your best: {data.me.best_score} · Rank #{data.me.rank}
              </p>
            )}
          </Card>

          <Card>
            <h3 className="font-display text-xl mb-4">Live Standings</h3>
            {data.leaderboard.length === 0 ? (
              <p className="font-mono text-sm text-muted">No entries yet — be the first.</p>
            ) : (
              <div>
                {data.leaderboard.map((entry) => {
                  const isMe = data.me.participated && entry.rank === data.me.rank;
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between py-2 border-b border-border last:border-0 font-mono text-sm${
                        isMe ? " text-rust bg-rust/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted w-8">#{entry.rank}</span>
                        <span>{entry.name || entry.username || "anon"}</span>
                        {entry.agent_used && (
                          <span className="text-muted text-xs">{entry.agent_used}</span>
                        )}
                      </div>
                      <span className="font-display">{entry.score}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
