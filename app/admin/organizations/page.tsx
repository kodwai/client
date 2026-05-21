"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/organizations?${params}`)
        .then((data) => { setOrgs(data?.organizations || []); setTotal(data?.total || 0); })
        .catch(() => setOrgs([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Organizations</h1>
      <p className="text-muted font-mono text-sm mb-2">{total} total</p>
      <Divider className="mx-0 my-6" />
      <div className="mb-6 max-w-md">
        <Input label="" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : orgs.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No organizations found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-4">Name</span>
            <span className="col-span-2 text-right">Members</span>
            <span className="col-span-2 text-right">Projects</span>
            <span className="col-span-2 text-right">Sessions</span>
            <span className="col-span-2 text-right">Created</span>
          </div>
          {orgs.map((o: any) => (
            <Link key={o.id} href={`/admin/organizations/${o.id}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer">
              <span className="col-span-4 font-display text-sm">{o.name}</span>
              <span className="col-span-2 font-mono text-xs text-muted text-right">{o.member_count}</span>
              <span className="col-span-2 font-mono text-xs text-muted text-right">{o.project_count}</span>
              <span className="col-span-2 font-mono text-xs text-muted text-right">{o.session_count}</span>
              <span className="col-span-2 font-mono text-[10px] text-muted text-right">{formatDate(o.created_at)}</span>
            </Link>
          ))}
        </div></div>
      )}
    </div>
  );
}
