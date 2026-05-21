"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/projects?${params}`)
        .then((data) => { setProjects(data?.projects || []); setTotal(data?.total || 0); })
        .catch(() => setProjects([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Projects</h1>
      <p className="text-muted font-mono text-sm mb-2">{total} interview projects</p>
      <Divider className="mx-0 my-6" />
      <div className="mb-6 max-w-md">
        <Input label="" placeholder="Search by title or organization..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No projects found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-3">Title</span>
            <span className="col-span-2">Organization</span>
            <span className="col-span-1">Difficulty</span>
            <span className="col-span-1 text-right">Time</span>
            <span className="col-span-1 text-right">Sessions</span>
            <span className="col-span-1 text-right">Avg Score</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Created</span>
          </div>
          {projects.map((p: any) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
              <span className="col-span-3 font-display text-sm truncate self-center">{p.title}</span>
              <span className="col-span-2 font-mono text-xs text-muted self-center truncate">{p.org_name}</span>
              <span className="col-span-1 self-center"><Badge variant={p.difficulty === "easy" ? "success" : p.difficulty === "hard" ? "error" : "warning"}>{p.difficulty || "—"}</Badge></span>
              <span className="col-span-1 font-mono text-xs text-muted text-right self-center">{p.time_limit_minutes}m</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right self-center">{p.session_count}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right self-center">{p.avg_score ? p.avg_score.toFixed(1) : "—"}</span>
              <span className="col-span-1 self-center">{p.is_archived ? <Badge variant="default">archived</Badge> : <span className="font-mono text-xs text-green-600">active</span>}</span>
              <span className="col-span-2 font-mono text-[10px] text-muted text-right self-center">{formatDate(p.created_at)}</span>
            </Link>
          ))}
        </div></div>
      )}
    </div>
  );
}
