"use client";

import { useEffect, useState } from "react";
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

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (difficulty) params.set("difficulty", difficulty);
        if (category) params.set("category", category);
        const qs = params.toString();
        const data = await api.get(`/api/challenges${qs ? `?${qs}` : ""}`);
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
  }, [search, difficulty, category]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Challenges</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Solve AI-agent coding challenges and climb the leaderboard
      </p>
      <Divider className="mx-0 my-8" />

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
          <option value="backend">Backend</option>
          <option value="frontend">Frontend</option>
          <option value="fullstack">Fullstack</option>
          <option value="algorithms">Algorithms</option>
          <option value="system-design">System Design</option>
          <option value="data">Data</option>
          <option value="devops">DevOps</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
        </div>
      ) : challenges.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No challenges found</p>
          <p className="font-mono text-sm text-muted">
            {search || difficulty || category
              ? "Try adjusting your filters."
              : "Challenges are coming soon."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <Link key={c.id} href={`/dev/challenges/${c.slug}`}>
              <Card className="h-full hover:border-rust/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={difficultyVariant[c.difficulty] || "info"}>
                    {c.difficulty}
                  </Badge>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {c.category}
                  </span>
                </div>
                <h3 className="font-display text-lg mb-2">{c.title}</h3>
                <p className="font-mono text-xs text-muted line-clamp-2 mb-4">
                  {c.description}
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <span className="font-mono text-xs text-muted">
                    {c.time_limit_minutes} min
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {c.submission_count} submissions
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
