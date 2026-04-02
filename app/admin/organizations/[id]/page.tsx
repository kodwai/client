"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

export default function AdminOrgDetailPage() {
  const params = useParams();
  const orgId = params.id as string;
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get(`/api/admin/organizations/${orgId}`)
      .then(setOrg).catch(() => setOrg(null)).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;
  if (!org) return <Card className="text-center py-12"><p className="font-display text-xl">Organization not found</p></Card>;

  return (
    <div>
      <Link href="/admin/organizations" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">&larr; Back</Link>
      <h1 className="font-display text-3xl mb-1">{org.name}</h1>
      <p className="text-muted font-mono text-sm mb-2">Created {formatDate(org.created_at)}</p>
      <Divider className="mx-0 my-6" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Members</p><p className="font-display text-2xl">{org.members?.length || 0}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Projects</p><p className="font-display text-2xl">{org.projects?.length || 0}</p></Card>
        <Card><p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Sessions</p><p className="font-display text-2xl">{org.recent_sessions?.length || 0}</p></Card>
      </div>

      {org.members?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg mb-3">Members</h2>
          <div className="space-y-2">
            {org.members.map((m: any) => (
              <Link key={m.id} href={`/admin/users/${m.id}`} className="block">
                <Card className="hover:border-rust/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-sm">{m.name}</p>
                      <p className="font-mono text-xs text-muted">{m.email}</p>
                    </div>
                    <Badge variant="default">{m.role}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {org.projects?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg mb-3">Projects</h2>
          <div className="space-y-2">
            {org.projects.map((p: any) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`}>
                <Card className="hover:border-rust/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.difficulty === "easy" ? "success" : p.difficulty === "hard" ? "error" : "warning"}>{p.difficulty}</Badge>
                      {!!p.is_archived && <Badge variant="default">archived</Badge>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {org.recent_sessions?.length > 0 && (
        <div>
          <h2 className="font-display text-lg mb-3">Recent Sessions</h2>
          <div className="space-y-2">
            {org.recent_sessions.map((s: any) => (
              <Link key={s.id} href={`/admin/sessions/${s.id}`} className="block">
                <Card className="hover:border-rust/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-sm">{s.candidate_name}</p>
                      <p className="font-mono text-xs text-muted">{s.project_title}</p>
                    </div>
                    <Badge variant={s.status === "completed" ? "success" : s.status === "active" ? "info" : "default"}>{s.status}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
