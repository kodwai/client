"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [agent, setAgent] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  function fetchLeaderboard() {
    setLoading(true);
    const params = new URLSearchParams();
    if (agent) params.set("agent", agent);
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    adminApi.get(`/api/admin/leaderboard?${params}`)
      .then((data) => { setEntries(data?.entries || []); setTotal(data?.total || 0); })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(fetchLeaderboard, 200);
    return () => clearTimeout(timer);
  }, [agent, category, search]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const result = await adminApi.post("/api/admin/leaderboard/recalculate", {});
      alert(`Recalculated ${result.recalculated} ranks`);
      fetchLeaderboard();
    } catch { /* ignore */ }
    finally { setRecalculating(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Leaderboard</h1>
        <Button variant="secondary" onClick={handleRecalculate} disabled={recalculating}>
          {recalculating ? "Recalculating..." : "Recalculate Ranks"}
        </Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{total} ranked developers</p>
      <Divider className="mx-0 my-6" />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-border bg-transparent font-mono text-sm" />
        </div>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All agents</option>
          <option value="claude-code">Claude Code</option>
          <option value="cursor">Cursor</option>
          <option value="codex">Codex</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
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
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : entries.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No ranked developers</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-1">Rank</span>
            <span className="col-span-3">Developer</span>
            <span className="col-span-2">Email</span>
            <span className="col-span-1 text-right">Score</span>
            <span className="col-span-1 text-right">Challenges</span>
            <span className="col-span-1">Agent</span>
            <span className="col-span-1 text-right">Streak</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {entries.map((e: any, i: number) => (
            <div key={e.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <span className="col-span-1 font-mono text-sm font-bold">{e.rank || i + 1}</span>
              <div className="col-span-3">
                <p className="font-display text-sm truncate">{e.name}</p>
                <p className="font-mono text-[10px] text-muted">@{e.username}</p>
              </div>
              <span className="col-span-2 font-mono text-xs text-muted truncate">{e.email}</span>
              <span className="col-span-1 font-display text-sm text-right">{e.total_score?.toFixed(0) || "—"}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{e.challenges_completed}</span>
              <span className="col-span-1 font-mono text-[10px] text-muted uppercase">{e.preferred_agent || "—"}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{e.streak_days || 0}d</span>
              <span className="col-span-2 text-right">
                <Link href={`/admin/users/${e.id}`} className="font-mono text-[10px] text-muted hover:text-ink transition-colors">View user</Link>
              </span>
            </div>
          ))}
        </div></div>
      )}
    </div>
  );
}
