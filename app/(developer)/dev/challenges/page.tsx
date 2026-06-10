"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useFeatureFlags } from "@/lib/feature-flags";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";
import { FreeSubmissionsBanner } from "@/components/free-submissions-banner";
import { ActiveChallengeBanner } from "@/components/active-challenge-banner";
import { SprintCountdown } from "@/components/sprint-countdown";

interface Challenge {
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
}

interface Quest {
  key: string;
  scope: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward_xp: number;
  completed: boolean;
  claimed: boolean;
}

const difficultyVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "difficulty", label: "Difficulty" },
] as const;

export default function ChallengesPage() {
  const { isEnabled } = useFeatureFlags();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [daily, setDaily] = useState<{ challenge: Challenge; completed_today: boolean } | null>(null);
  const [sprint, setSprint] = useState<{ challenge: { title: string; slug: string; difficulty: string; category: string }; ends_at: string } | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const params = new URLSearchParams();
        params.set("limit", "100");
        params.set("sort", sort);
        if (search) params.set("search", search);
        if (difficulty) params.set("difficulty", difficulty);
        if (category) params.set("category", category);
        const data = await api.get(`/api/challenges?${params}`);
        setChallenges(data);
      } catch {
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    const timer = setTimeout(fetchChallenges, 200);
    return () => clearTimeout(timer);
  }, [search, difficulty, category, sort]);

  useEffect(() => {
    api.get("/api/challenges/daily").then(setDaily).catch(() => setDaily(null));
  }, []);

  useEffect(() => {
    api.get("/api/sprint/current").then(setSprint).catch(() => setSprint(null));
  }, []);

  useEffect(() => {
    api.get("/api/quests").then(setQuests).catch(() => setQuests([]));
  }, []);

  async function claimQuest(key: string) {
    try {
      await api.post("/api/quests/" + key + "/claim", {});
      const data = await api.get("/api/quests");
      setQuests(data);
    } catch {
      // ignore
    }
  }

  const stats = useMemo(() => {
    const cats = new Map<string, number>();
    const diffs = new Map<string, number>();
    for (const c of challenges) {
      cats.set(c.category, (cats.get(c.category) || 0) + 1);
      diffs.set(c.difficulty, (diffs.get(c.difficulty) || 0) + 1);
    }
    return { cats, diffs, total: challenges.length };
  }, [challenges]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const c of challenges) cats.add(c.category);
    return Array.from(cats).sort();
  }, [challenges]);

  function clearFilters() {
    setSearch("");
    setDifficulty("");
    setCategory("");
    setSort("newest");
  }

  const hasFilters = search || difficulty || category;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-display text-3xl">Challenges</h1>
        {!loading && (
          <span className="font-mono text-xs text-muted">
            {stats.total} challenge{stats.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        Solve AI-agent coding challenges and climb the leaderboard
      </p>
      <Divider className="mx-0 my-8" />

      <ActiveChallengeBanner />
      <FreeSubmissionsBanner />

      {/* Challenge of the day */}
      {daily && (
        <Card className="mb-8 border-rust/30 hover:border-rust/50 transition-colors">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
            ★ Challenge of the Day
          </span>
          <h2 className="font-display text-2xl mt-2 mb-3">{daily.challenge.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={difficultyVariant[daily.challenge.difficulty] || "info"}>
              {daily.challenge.difficulty}
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {daily.challenge.category}
            </span>
            <span className="font-mono text-xs text-muted">
              {daily.challenge.time_limit_minutes} min
            </span>
          </div>
          {daily.completed_today ? (
            <span className="font-mono text-sm text-green-600">✓ Completed today</span>
          ) : (
            <Link
              href={`/dev/challenges/${daily.challenge.slug}`}
              className="font-mono text-sm text-rust hover:text-rust-hover transition-colors"
            >
              Start challenge →
            </Link>
          )}
        </Card>
      )}

      {isEnabled("weekly_sprint") && sprint && (
        <Card className="mb-8 border-rust/30 hover:border-rust/50 transition-colors">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
            ⚡ Weekly Sprint
          </span>
          <h2 className="font-display text-2xl mt-2 mb-3">{sprint.challenge.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={difficultyVariant[sprint.challenge.difficulty] || "info"}>
              {sprint.challenge.difficulty}
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {sprint.challenge.category}
            </span>
            <span className="font-mono text-xs text-muted">
              Ends in <SprintCountdown endsAt={sprint.ends_at} />
            </span>
          </div>
          <Link
            href="/dev/sprint"
            className="font-mono text-sm text-rust hover:text-rust-hover transition-colors"
          >
            View sprint →
          </Link>
        </Card>
      )}

      {/* Quests */}
      {quests.length > 0 && (
        <Card className="mb-8">
          <h2 className="font-display text-xl mb-4">Quests</h2>
          {(["daily", "weekly"] as const).map((scope) => {
            const scoped = quests.filter((q) => q.scope === scope);
            if (scoped.length === 0) return null;
            return (
              <div key={scope} className="mb-6 last:mb-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
                  {scope}
                </p>
                <div className="space-y-3">
                  {scoped.map((q) => {
                    const pct = q.target > 0 ? Math.min(100, (q.current / q.target) * 100) : 0;
                    return (
                      <div
                        key={q.key}
                        className="flex items-center gap-4 py-2 border-b border-border last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm">{q.title}</p>
                          <p className="font-mono text-xs text-muted mb-2">{q.description}</p>
                          <div className="h-1.5 bg-cream-dark/30 border border-border overflow-hidden">
                            <div className="h-full bg-rust" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="font-mono text-[10px] text-rust mt-1">+{q.reward_xp} XP</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {q.completed && !q.claimed ? (
                            <Button onClick={() => claimQuest(q.key)}>Claim</Button>
                          ) : q.claimed ? (
                            <span className="font-mono text-xs text-green-600">Claimed ✓</span>
                          ) : (
                            <span className="font-mono text-xs text-muted">
                              {q.current}/{q.target}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Difficulty pills */}
      {!loading && !hasFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className="flex items-center gap-2 px-3 py-1.5 border border-border hover:border-rust/30 transition-colors bg-transparent cursor-pointer"
            >
              <Badge variant={difficultyVariant[d]}>{d}</Badge>
              <span className="font-mono text-xs text-muted">
                {stats.diffs.get(d) || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1">
          <Input
            label=""
            type="text"
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs text-muted">
            {stats.total} result{stats.total !== 1 ? "s" : ""}
          </span>
          <button
            onClick={clearFilters}
            className="font-mono text-xs text-rust hover:text-rust-hover transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Clear filters
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-12 bg-cream-dark/50" />
                <div className="h-5 w-16 bg-cream-dark/30" />
              </div>
              <div className="h-5 w-3/4 bg-cream-dark/40 mb-2" />
              <div className="h-4 w-full bg-cream-dark/20 mb-1" />
              <div className="h-4 w-2/3 bg-cream-dark/20" />
            </Card>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No challenges found</p>
          <p className="font-mono text-sm text-muted">
            {hasFilters
              ? "Try adjusting your filters."
              : "Challenges are coming soon."}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="font-mono text-sm text-rust hover:text-rust-hover transition-colors mt-4 cursor-pointer bg-transparent border-none"
            >
              Clear all filters
            </button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <Link key={c.id} href={`/dev/challenges/${c.slug}`}>
              <Card className="h-full hover:border-rust/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={difficultyVariant[c.difficulty] || "info"}>
                    {c.difficulty}
                  </Badge>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {c.category}
                  </span>
                  {c.is_featured && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg mb-2 group-hover:text-rust transition-colors">
                  {c.title}
                </h3>
                <p className="font-mono text-xs text-muted line-clamp-2 mb-4">
                  {c.description}
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <span className="font-mono text-xs text-muted">
                    {c.time_limit_minutes} min
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {c.submission_count} submission{c.submission_count !== 1 ? "s" : ""}
                  </span>
                  {c.avg_score != null && (
                    <span className="font-mono text-xs text-muted">
                      avg {c.avg_score.toFixed(0)}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
