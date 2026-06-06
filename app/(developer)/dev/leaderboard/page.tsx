"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";

interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  total_score: number;
  challenges_completed: number;
  preferred_agent: string | null;
  rank: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<{ slug: string; display: string }[]>([]);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<CategoryCount[]>([]);

  useEffect(() => {
    api
      .get("/api/challenges/categories")
      .then((data: CategoryCount[]) => setCategories(data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    api.get("/api/leaderboard/models").then((d) => setModels(d || [])).catch(() => setModels([]));
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (agent) params.set("agent", agent);
        if (model) params.set("model", model);
        if (category) params.set("category", category);
        const qs = params.toString();
        const data = await api.get(`/api/leaderboard${qs ? `?${qs}` : ""}`);
        setEntries(data.entries || []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    fetchData();
  }, [agent, model, category]);

  // Build description based on filters
  let description = "See how you rank against other developers";
  if (agent && category) {
    description = `Rankings for ${agent} users in ${category} challenges`;
  } else if (agent) {
    description = `Rankings based on ${agent} submissions only`;
  } else if (category) {
    description = `Rankings for ${category} challenges only`;
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Leaderboard</h1>
      <p className="text-muted font-mono text-sm mb-2">{description}</p>
      <Divider className="mx-0 my-8" />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
        >
          <option value="">All agents</option>
          <option value="claude-code">Claude Code</option>
          <option value="cursor">Cursor</option>
          <option value="codex">Codex</option>
        </select>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
        >
          <option value="">All models</option>
          {models.map((m) => (
            <option key={m.slug} value={m.slug}>{m.display}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category.charAt(0).toUpperCase() + c.category.slice(1).replace(/-/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No rankings yet</p>
          <p className="font-mono text-sm text-muted">
            {agent || category
              ? "No submissions match these filters yet."
              : "Complete challenges to appear on the leaderboard."}
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
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Challenges</span>
              <span className="col-span-2 font-mono text-[10px] uppercase tracking-widest text-muted text-right">Agent</span>
            </div>
            {entries.map((entry) => {
              const isMe = user?.username === entry.username;
              return (
                <Link
                  href={`/developers/${entry.username}`}
                  key={entry.id || entry.username}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer ${isMe ? "bg-rust/5" : ""}`}
                >
                  <span className="col-span-1 flex items-center justify-center">
                    {entry.rank <= 3 ? <RankMedal rank={entry.rank} /> : <span className="font-mono text-sm text-muted">#{entry.rank}</span>}
                  </span>
                  <div className="col-span-5">
                    <p className="font-display text-sm">{entry.name} {isMe && <span className="font-mono text-[10px] text-rust">(you)</span>}</p>
                    <p className="font-mono text-xs text-muted">@{entry.username}</p>
                  </div>
                  <span className="col-span-2 font-display text-sm text-right">{entry.total_score?.toFixed(0) || "—"}</span>
                  <span className="col-span-2 font-mono text-xs text-muted text-right">{entry.challenges_completed}</span>
                  <span className="col-span-2 font-mono text-[10px] text-muted text-right uppercase">{entry.preferred_agent || "—"}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {entries.map((entry) => {
              const isMe = user?.username === entry.username;
              return (
                <Link href={`/developers/${entry.username}`} key={entry.id || entry.username}>
                  <div className={`border border-border p-4 hover:border-rust/30 transition-colors ${isMe ? "bg-rust/5 border-rust/20" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {entry.rank <= 3 ? <RankMedal rank={entry.rank} /> : <span className="font-mono text-sm text-muted font-bold">#{entry.rank}</span>}
                        <div>
                          <p className="font-display text-sm">{entry.name} {isMe && <span className="font-mono text-[10px] text-rust">(you)</span>}</p>
                          <p className="font-mono text-xs text-muted">@{entry.username}</p>
                        </div>
                      </div>
                      <p className="font-display text-xl">{entry.total_score?.toFixed(0) || "—"}</p>
                    </div>
                    <div className="flex gap-4 font-mono text-[10px] text-muted uppercase tracking-widest">
                      <span>{entry.challenges_completed} challenges</span>
                      <span>{entry.preferred_agent || "—"}</span>
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

function RankMedal({ rank }: { rank: number }) {
  const images: Record<number, string> = {
    1: "/badges/rank-1.png",
    2: "/badges/rank-2.png",
    3: "/badges/rank-3.png",
  };

  if (images[rank]) {
    return <img src={images[rank]} alt={`Rank ${rank}`} className="w-8 h-8 object-contain" />;
  }

  return <span className="font-mono text-sm text-muted">#{rank}</span>;
}
