"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  username: string | null;
  user_type: string;
  role: string;
  email_verified: boolean;
  is_banned: boolean;
  banned_reason: string | null;
  banned_at: string | null;
  is_superadmin: boolean;
  created_at: string;
  organization?: { id: string; name: string };
  developer_profile?: { total_score: number; challenges_completed: number; rank: number; preferred_agent: string };
  submission_count: number;
  session_count?: number;
  recent_submissions?: any[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [acting, setActing] = useState(false);

  function fetchUser() {
    adminApi.get(`/api/admin/users/${userId}`)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUser(); }, [userId]);

  async function handleAction(patch: Record<string, any>) {
    setActing(true);
    try {
      const updated = await adminApi.patch(`/api/admin/users/${userId}`, patch);
      setUser(updated);
      setBanModal(false);
      setBanReason("");
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActing(false);
    }
  }

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;
  if (!user) return <Card className="text-center py-12"><p className="font-display text-xl">User not found</p></Card>;

  return (
    <div>
      <Link href="/admin/users" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">&larr; Back to users</Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="font-display text-3xl">{user.name}</h1>
          <p className="font-mono text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.user_type === "developer" ? "info" : "default"}>{user.user_type}</Badge>
          {!!user.is_banned && <Badge variant="error">banned</Badge>}
          {!!user.is_superadmin && <Badge variant="warning">superadmin</Badge>}
        </div>
      </div>
      <Divider className="mx-0 my-6" />

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {user.user_type === "company" && (
          <Card>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Role</p>
            <p className="font-display text-xl">{user.role}</p>
          </Card>
        )}
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Verified</p>
          <p className="font-display text-xl">{user.email_verified ? "Yes" : "No"}</p>
        </Card>
        {user.user_type === "developer" && (
          <Card>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Submissions</p>
            <p className="font-display text-xl">{user.submission_count}</p>
          </Card>
        )}
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Joined</p>
          <p className="font-mono text-xs">{formatDateTime(user.created_at)}</p>
        </Card>
      </div>

      {/* Developer profile */}
      {user.developer_profile && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-3">Developer Profile</h2>
          <div className="grid grid-cols-4 gap-4 font-mono text-sm">
            <div><span className="text-muted text-xs block">Score</span>{user.developer_profile.total_score?.toFixed(0) || "—"}</div>
            <div><span className="text-muted text-xs block">Challenges</span>{user.developer_profile.challenges_completed}</div>
            <div><span className="text-muted text-xs block">Rank</span>{user.developer_profile.rank || "—"}</div>
            <div><span className="text-muted text-xs block">Agent</span>{user.developer_profile.preferred_agent || "—"}</div>
          </div>
        </Card>
      )}

      {/* Organization */}
      {user.organization && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-2">Organization</h2>
          <p className="font-mono text-sm">{user.organization.name}</p>
          {user.session_count != null && <p className="font-mono text-xs text-muted mt-1">{user.session_count} sessions</p>}
        </Card>
      )}

      {/* Banned info */}
      {!!user.is_banned && (
        <Card className="mb-6 border-rust/30 bg-rust/5">
          <h2 className="font-display text-lg mb-2 text-rust">Banned</h2>
          <p className="font-mono text-sm">{user.banned_reason || "No reason provided"}</p>
          {user.banned_at && <p className="font-mono text-xs text-muted mt-1">Since {formatDateTime(user.banned_at)}</p>}
        </Card>
      )}

      {/* Submissions (developer) */}
      {(user.recent_submissions?.length ?? 0) > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg mb-3">Recent Submissions ({user.submission_count})</h2>
          <div className="admin-table-scroll"><div className="border border-border">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span className="col-span-4">Challenge</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2">Agent</span>
              <span className="col-span-2 text-right">Score</span>
              <span className="col-span-2 text-right">Time</span>
            </div>
            {user.recent_submissions!.map((s: any) => (
              <Link key={s.id} href={`/admin/submissions/${s.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
                <div className="col-span-4">
                  <p className="font-display text-sm truncate">{s.challenge_title}</p>
                  <Badge variant={s.difficulty === "easy" ? "success" : s.difficulty === "hard" ? "error" : "warning"}>{s.difficulty}</Badge>
                </div>
                <span className="col-span-2 self-center"><Badge variant={s.status === "scored" ? "success" : s.status === "error" ? "error" : "info"}>{s.status}</Badge></span>
                <span className="col-span-2 font-mono text-[10px] text-muted self-center uppercase">{s.agent_used || "—"}</span>
                <span className="col-span-2 font-display text-sm text-right self-center">
                  {s.score != null ? <span className={s.score >= 70 ? "text-green-700" : s.score >= 50 ? "text-amber-600" : "text-rust"}>{s.score.toFixed(0)}</span> : "—"}
                </span>
                <span className="col-span-2 font-mono text-xs text-muted text-right self-center">{s.time_taken_ms ? `${Math.round(s.time_taken_ms / 60000)}m` : "—"}</span>
              </Link>
            ))}
          </div></div>
        </div>
      )}

      {/* Actions */}
      <Card accent>
        <h2 className="font-display text-lg mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {!user.email_verified && (
            <Button variant="secondary" disabled={acting} onClick={() => handleAction({ email_verified: true })}>
              Verify Email
            </Button>
          )}
          {user.is_banned ? (
            <Button variant="secondary" disabled={acting} onClick={() => handleAction({ is_banned: false })}>
              Unban User
            </Button>
          ) : (
            <Button variant="secondary" disabled={acting} onClick={() => setBanModal(true)}>
              Ban User
            </Button>
          )}
          {user.user_type === "company" && (
            <select
              value={user.role}
              onChange={(e) => handleAction({ role: e.target.value })}
              disabled={acting}
              className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
            >
              <option value="admin">Admin</option>
              <option value="interviewer">Interviewer</option>
              <option value="viewer">Viewer</option>
            </select>
          )}
          <Button
            variant="secondary"
            disabled={acting}
            onClick={() => handleAction({ is_superadmin: !user.is_superadmin })}
          >
            {user.is_superadmin ? "Remove Superadmin" : "Make Superadmin"}
          </Button>
        </div>
      </Card>

      {/* Ban modal */}
      <Modal
        open={banModal}
        onClose={() => setBanModal(false)}
        title="Ban User"
        description={`Ban ${user.name}? They will not be able to use the platform.`}
        confirmLabel="Ban"
        onConfirm={() => handleAction({ is_banned: true, banned_reason: banReason || "Banned by admin" })}
        loading={acting}
      />
      {banModal && (
        <div className="fixed inset-0 z-40" /> // Invisible overlay for the reason input
      )}
    </div>
  );
}
