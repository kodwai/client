"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";

interface Stats {
  users: { total: number; developers: number; companies: number; verified: number; banned: number; signups_today: number };
  challenges: { total: number; published: number; featured: number };
  submissions: { total: number; scored: number; in_progress: number; errors: number; today: number };
  sessions: { total: number; active: number; completed: number; expired: number };
  organizations: { total: number };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/api/admin/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return <p className="font-mono text-sm text-rust">Failed to load stats</p>;
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Dashboard</h1>
      <p className="text-muted font-mono text-sm mb-2">Platform overview</p>
      <Divider className="mx-0 my-8" />

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.users.total} sub={`${stats.users.signups_today} today`} />
        <StatCard label="Developers" value={stats.users.developers} />
        <StatCard label="Companies" value={stats.users.companies} />
        <StatCard label="Organizations" value={stats.organizations.total} />
        <StatCard label="Banned" value={stats.users.banned} accent={stats.users.banned > 0} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Challenges" value={stats.challenges.total} sub={`${stats.challenges.published} published`} />
        <StatCard label="Featured" value={stats.challenges.featured} />
        <StatCard label="Submissions" value={stats.submissions.total} sub={`${stats.submissions.today} today`} />
        <StatCard label="Scored" value={stats.submissions.scored} />
        <StatCard label="Errors" value={stats.submissions.errors} accent={stats.submissions.errors > 0} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Sessions" value={stats.sessions.total} />
        <StatCard label="Active" value={stats.sessions.active} />
        <StatCard label="Completed" value={stats.sessions.completed} />
        <StatCard label="Expired" value={stats.sessions.expired} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-rust/30" : ""}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className={`font-display text-2xl ${accent ? "text-rust" : ""}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted mt-1">{sub}</p>}
    </Card>
  );
}
