"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  user_type: string;
  role: string;
  email_verified: boolean;
  is_banned: boolean;
  is_superadmin: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (userType) params.set("user_type", userType);
    params.set("page", String(page));
    const qs = params.toString();

    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/users?${qs}`)
        .then((data) => { setUsers(data.users || []); setTotal(data.total || 0); })
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, userType, page]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Users</h1>
      <p className="text-muted font-mono text-sm mb-2">{total} total users</p>
      <Divider className="mx-0 my-6" />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input label="" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1); }} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All types</option>
          <option value="developer">Developer</option>
          <option value="company">Company</option>
        </select>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : users.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No users found</p></Card>
      ) : (
        <>
          <div className="admin-table-scroll"><div className="border border-border">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span className="col-span-3">Name</span>
              <span className="col-span-3">Email</span>
              <span className="col-span-1">Type</span>
              <span className="col-span-1">Role</span>
              <span className="col-span-1 text-center">Verified</span>
              <span className="col-span-1 text-center">Status</span>
              <span className="col-span-2 text-right">Joined</span>
            </div>
            {users.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
                <div className="col-span-3">
                  <p className="font-display text-sm truncate">{u.name}</p>
                  {u.username && <p className="font-mono text-[10px] text-muted">@{u.username}</p>}
                </div>
                <span className="col-span-3 font-mono text-xs text-muted truncate self-center">{u.email}</span>
                <span className="col-span-1 self-center">
                  <Badge variant={u.user_type === "developer" ? "info" : "default"}>{u.user_type}</Badge>
                </span>
                <span className="col-span-1 font-mono text-xs text-muted self-center">{u.user_type === "company" ? u.role : "—"}</span>
                <span className="col-span-1 text-center self-center">
                  {u.email_verified ? <span className="text-green-600">&#10003;</span> : <span className="text-muted">&#10007;</span>}
                </span>
                <span className="col-span-1 text-center self-center">
                  {u.is_banned ? <Badge variant="error">banned</Badge> : u.is_superadmin ? <Badge variant="warning">admin</Badge> : <span className="text-green-600 font-mono text-xs">active</span>}
                </span>
                <span className="col-span-2 font-mono text-xs text-muted text-right self-center">{formatDate(u.created_at)}</span>
              </Link>
            ))}
          </div></div>

          {total > 50 && (
            <div className="flex justify-center gap-4 mt-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="font-mono text-xs text-muted hover:text-ink disabled:opacity-30">&larr; Prev</button>
              <span className="font-mono text-xs text-muted">Page {page}</span>
              <button disabled={page * 50 >= total} onClick={() => setPage(page + 1)} className="font-mono text-xs text-muted hover:text-ink disabled:opacity-30">Next &rarr;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
