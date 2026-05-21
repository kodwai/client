"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

export default function AdminAnalyticsPage() {
  const [signups, setSignups] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.get(`/api/admin/analytics/signups?days=${days}`).catch(() => []),
      adminApi.get(`/api/admin/analytics/submissions?days=${days}`).catch(() => []),
      adminApi.get(`/api/admin/analytics/sessions?days=${days}`).catch(() => []),
      adminApi.get("/api/admin/analytics/agents").catch(() => []),
      adminApi.get("/api/admin/analytics/challenges").catch(() => []),
      adminApi.get("/api/admin/analytics/scores").catch(() => []),
    ]).then(([s, sub, sess, ag, ch, sc]) => {
      setSignups(s || []);
      setSubs(sub || []);
      setSessions(sess || []);
      setAgents(ag || []);
      setChallenges(ch || []);
      setScores(sc || []);
    }).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;

  const totalSignups = signups.reduce((a, b) => a + b.count, 0);
  const totalSubs = subs.reduce((a, b) => a + b.count, 0);
  const totalSessions = sessions.reduce((a, b) => a + b.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Analytics</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      <p className="text-muted font-mono text-sm mb-2">Platform activity over the last {days} days</p>
      <Divider className="mx-0 my-6" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Signups ({days}d)</p><p className="font-display text-2xl">{totalSignups}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Submissions ({days}d)</p><p className="font-display text-2xl">{totalSubs}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Sessions ({days}d)</p><p className="font-display text-2xl">{totalSessions}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Active Agents</p><p className="font-display text-2xl">{agents.length}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Active Challenges</p><p className="font-display text-2xl">{challenges.length}</p></Card>
      </div>

      {/* Timeline charts */}
      <BarChart title="Signups" data={signups} color="bg-rust" />
      <BarChart title="Submissions" data={subs} color="bg-green-600" />
      <BarChart title="Sessions" data={sessions} color="bg-amber-500" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Agent distribution */}
        <Card>
          <h2 className="font-display text-lg mb-3">Agent Usage</h2>
          {agents.length > 0 ? (
            <div className="space-y-2">
              {agents.map((a: any) => (
                <div key={a.agent_used} className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase">{a.agent_used}</span>
                  <span className="font-display text-sm">{a.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="font-mono text-xs text-muted">No data</p>}
        </Card>

        {/* Top challenges */}
        <Card>
          <h2 className="font-display text-lg mb-3">Top Challenges</h2>
          {challenges.length > 0 ? (
            <div className="space-y-2">
              {challenges.slice(0, 5).map((c: any) => (
                <div key={c.slug} className="flex items-center justify-between">
                  <span className="font-mono text-xs truncate mr-2">{c.title}</span>
                  <span className="font-display text-sm shrink-0">{c.submission_count}</span>
                </div>
              ))}
            </div>
          ) : <p className="font-mono text-xs text-muted">No data</p>}
        </Card>

        {/* Score distribution */}
        <Card>
          <h2 className="font-display text-lg mb-3">Score Distribution</h2>
          {scores.length > 0 ? (
            <div className="space-y-2">
              {scores.map((s: any) => {
                const maxC = Math.max(...scores.map((x: any) => x.count), 1);
                return (
                  <div key={s.bucket}>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-mono text-[10px]">{s.bucket}</span>
                      <span className="font-mono text-[10px] text-muted">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-border">
                      <div className="h-full bg-rust/60" style={{ width: `${(s.count / maxC) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="font-mono text-xs text-muted">No data</p>}
        </Card>
      </div>
    </div>
  );
}

function BarChart({ title, data, color }: { title: string; data: any[]; color: string }) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barHeight = 80; // max bar height in px

  return (
    <Card className="mb-6">
      <h2 className="font-display text-lg mb-3">{title}</h2>
      <div className="flex items-end gap-[2px]" style={{ height: barHeight + 20 }}>
        {data.map((d, i) => {
          const h = Math.max((d.count / maxCount) * barHeight, 2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              {d.count > 0 && (
                <span className="font-mono text-[9px] text-ink mb-0.5">{d.count}</span>
              )}
              <div className={`w-full rounded-t-sm transition-colors ${color}`} style={{ height: h, opacity: 0.75 }} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 font-mono text-[9px] text-muted">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </Card>
  );
}
