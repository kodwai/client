"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "interviewer" | "viewer";
}

const ROLES = ["admin", "interviewer", "viewer"] as const;

const roleBadgeVariant: Record<string, "default" | "success" | "warning"> = {
  admin: "success",
  interviewer: "default",
  viewer: "warning",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLES)[number]>("interviewer");
  const [inviting, setInviting] = useState(false);

  async function fetchMembers() {
    try {
      const data = await api.get("/api/organizations/me/members");
      setMembers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError("");

    try {
      await api.post("/api/organizations/me/invitations", {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setInviteRole("interviewer");
      setShowInvite(false);
      await fetchMembers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setError("");
    try {
      await api.put(`/api/organizations/me/members/${memberId}`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: newRole as Member["role"] } : m
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    }
  }

  async function handleRemove(memberId: string) {
    setError("");
    try {
      await api.delete(`/api/organizations/me/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove member.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl">Team Members</h1>
        <Button
          variant="secondary"
          onClick={() => setShowInvite(!showInvite)}
        >
          {showInvite ? "Cancel" : "Invite Member"}
        </Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        Manage who has access to your organization
      </p>
      <Divider className="mx-0 my-8" />

      {error && (
        <p className="font-mono text-xs text-rust mb-4">{error}</p>
      )}

      {showInvite && (
        <Card accent className="mb-8">
          <h2 className="font-display text-xl mb-4">Invite a Team Member</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
            />

            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-widest text-muted">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as (typeof ROLES)[number])}
                className="w-full border-b-2 border-border bg-transparent py-2 font-display text-lg text-ink outline-none transition-colors focus:border-rust"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={inviting}>
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </form>
        </Card>
      )}

      {members.length === 0 ? (
        <Card>
          <p className="font-mono text-sm text-muted text-center py-4">
            No team members yet. Invite someone to get started.
          </p>
        </Card>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-white/50">
                <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted">
                  Name
                </th>
                <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted">
                  Email
                </th>
                <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted">
                  Role
                </th>
                <th className="text-right px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-b-0 hover:bg-cream-dark/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-sm text-ink">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-muted">
                    {member.email}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="bg-transparent font-mono text-xs uppercase tracking-widest text-ink outline-none cursor-pointer"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                    <Badge variant={roleBadgeVariant[member.role] || "default"} className="ml-2">
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
