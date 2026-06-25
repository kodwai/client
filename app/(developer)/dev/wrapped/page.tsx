"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useFeatureFlags } from "@/lib/feature-flags";
import { Card } from "@/components/ui/card";

interface Wrapped {
  name: string;
  username: string;
  member_since: string;
  challenges_completed: number;
  submissions: number;
  best_score: number | null;
  direction_rating: number;
  efficiency_rating: number;
  streak_days: number;
  rank: number | null;
  badges_count: number;
  favorite_agent: string | null;
  favorite_model: string | null;
  top_category: { key: string; rating: number } | null;
}

function titleCaseKey(key: string): string {
  return key
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <Card accent={accent} className="flex flex-col justify-between min-h-[140px]">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="font-display text-5xl sm:text-6xl mt-4 leading-none break-words">
        {value}
        {suffix && <span className="font-display text-2xl text-muted ml-1">{suffix}</span>}
      </p>
    </Card>
  );
}

export default function WrappedPage() {
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const [data, setData] = useState<Wrapped | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/developers/me/wrapped")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (!flagsLoading && !isEnabled("wrapped")) {
    return (
      <Card className="text-center py-12">
        <p className="font-display text-xl">kodwai Wrapped is unavailable</p>
        <p className="font-mono text-sm text-muted mt-2">This feature is currently turned off.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="text-center py-12">
        <p className="font-display text-xl">Your Wrapped isn&apos;t ready yet</p>
        <Link
          href="/dev/challenges"
          className="font-mono text-sm text-rust hover:text-rust-hover transition-colors mt-3 inline-block"
        >
          Complete a challenge to get started &rarr;
        </Link>
      </Card>
    );
  }

  const headline = data.name ? `${data.name}'s kodwai Wrapped` : "Your kodwai Wrapped";

  const bestScore = data.best_score ?? "–";
  const topCategory = data.top_category
    ? `${titleCaseKey(data.top_category.key)} (${data.top_category.rating})`
    : "—";

  const summary = `My kodwai Wrapped — Direction Rating ${data.direction_rating}, ${data.challenges_completed} challenges, best ${data.best_score ?? "–"}/100, ${data.streak_days}-day streak. Prove how you wield AI agents: kodwai.com`;
  const shareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(summary)}`;

  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-rust mb-3">
          ✨ kodwai Wrapped
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">{headline}</h1>
        <p className="font-mono text-sm text-muted mt-3">
          {data.submissions} submissions · {data.rank ? `Rank #${data.rank}` : "Unranked"} · @{data.username}
        </p>
      </div>

      {/* Headline stat */}
      <Card accent className="mb-8 bg-rust/5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Direction Rating</p>
        <p className="font-display text-7xl sm:text-8xl text-rust mt-3 leading-none">
          {data.direction_rating}
        </p>
        <p className="font-mono text-xs text-muted mt-3">How well you steer AI agents toward the goal</p>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Efficiency Rating" value={data.efficiency_rating} />
        <StatCard label="Challenges Completed" value={data.challenges_completed} />
        <StatCard
          label="Best Score"
          value={bestScore}
          suffix={data.best_score != null ? "/100" : undefined}
        />
        <StatCard label="Current Streak" value={data.streak_days} suffix="days" />
        <StatCard label="Badges Earned" value={data.badges_count} accent />
        <Card className="flex flex-col justify-between min-h-[140px]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Favorite Agent</p>
          <p className="font-display text-3xl sm:text-4xl mt-4 leading-tight break-words text-green-700">
            {data.favorite_agent ?? "—"}
          </p>
        </Card>
        <Card className="flex flex-col justify-between min-h-[140px]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Favorite Model</p>
          <p className="font-display text-3xl sm:text-4xl mt-4 leading-tight break-words">
            {data.favorite_model ?? "—"}
          </p>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-3 flex flex-col justify-between min-h-[120px]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Top Category</p>
          <p className="font-display text-4xl sm:text-5xl mt-4 leading-tight break-words text-green-700">
            {topCategory}
          </p>
        </Card>
      </div>

      {/* Share */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-cream font-mono text-xs uppercase tracking-widest hover:bg-ink/80 transition-colors"
        >
          Share on X
        </a>
        <Link
          href="/dev/profile"
          className="font-mono text-xs text-rust hover:text-rust-hover transition-colors"
        >
          &larr; Back to profile
        </Link>
      </div>
    </div>
  );
}
