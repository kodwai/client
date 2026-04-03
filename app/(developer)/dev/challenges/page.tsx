"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
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
