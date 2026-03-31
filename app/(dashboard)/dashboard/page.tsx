"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface Stats {
  totalProjects: number;
  activeSessions: number;
  completedSessions: number;
}

interface RecentSession {
  id: string;
  candidate_name: string;
  project_title: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, activeSessions: 0, completedSessions: 0 });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/projects"),
      api.get("/api/sessions"),
    ])
      .then(([projects, sessions]) => {
        const projectList = Array.isArray(projects) ? projects : [];
        const sessionList = Array.isArray(sessions) ? sessions : [];

        setStats({
          totalProjects: projectList.length,
          activeSessions: sessionList.filter((s: RecentSession) => s.status === "active").length,
          completedSessions: sessionList.filter((s: RecentSession) => s.status === "completed").length,
        });

        setRecentSessions(sessionList.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Projects", value: stats.totalProjects, href: "/projects" },
    { label: "Active Sessions", value: stats.activeSessions, href: "/sessions" },
    { label: "Completed Sessions", value: stats.completedSessions, href: "/sessions" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-4xl mb-2">
        Welcome{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="text-muted font-mono text-sm mb-2">
        Your AI interview platform overview
      </p>
      <Divider className="mx-0 my-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card accent className="hover:border-rust/30 transition-colors cursor-pointer">
              <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
                {stat.label}
              </p>
              <p className="font-display text-4xl">{stat.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {recentSessions.length > 0 && (
        <>
          <Divider className="mx-0 my-8" />
          <h2 className="font-display text-xl mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <div className="flex items-center justify-between py-3 px-4 border-b border-border hover:bg-cream-dark/50 transition-colors cursor-pointer">
                  <div>
                    <span className="font-display text-sm">{session.candidate_name}</span>
                    <span className="font-mono text-xs text-muted ml-3">{session.project_title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant={session.status === "active" ? "success" : session.status === "completed" ? "info" : "default"}>
                      {session.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
