"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/api/admin/api-keys")
      .then((data) => { setKeys(data?.keys || []); setTotal(data?.total || 0); })
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      if (currentActive) {
        await adminApi.patch(`/api/admin/api-keys/${id}/deactivate`);
      } else {
        await adminApi.patch(`/api/admin/api-keys/${id}/activate`);
      }
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: !currentActive } : k));
    } catch { /* ignore */ }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">API Keys</h1>
      <p className="text-muted font-mono text-sm mb-2">{total} total keys across all users</p>
      <Divider className="mx-0 my-6" />

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : keys.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No API keys found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-2">Label</span>
            <span className="col-span-1">Key</span>
            <span className="col-span-3">Owner</span>
            <span className="col-span-1">Type</span>
            <span className="col-span-1 text-center">Active</span>
            <span className="col-span-2 text-right">Created</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {keys.map((k: any) => (
            <div key={k.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <span className="col-span-2 font-display text-sm truncate">{k.label}</span>
              <span className="col-span-1 font-mono text-xs text-muted">····{k.key_last4}</span>
              <div className="col-span-3">
                <p className="font-mono text-xs truncate">{k.user_name || k.org_name || "—"}</p>
                <p className="font-mono text-[10px] text-muted truncate">{k.user_email}</p>
              </div>
              <span className="col-span-1"><Badge variant={k.user_type === "developer" ? "info" : "default"}>{k.organization_id ? "org" : "dev"}</Badge></span>
              <span className="col-span-1 text-center">
                {k.is_active ? <span className="text-green-600 font-mono text-xs">active</span> : <span className="text-rust font-mono text-xs">inactive</span>}
              </span>
              <span className="col-span-2 font-mono text-[10px] text-muted text-right">{formatDate(k.created_at)}</span>
              <span className="col-span-2 text-right">
                <button
                  onClick={() => handleToggle(k.id, k.is_active)}
                  className={`font-mono text-[10px] transition-colors cursor-pointer ${k.is_active ? "text-muted hover:text-rust" : "text-muted hover:text-green-600"}`}
                >
                  {k.is_active ? "Deactivate" : "Activate"}
                </button>
              </span>
            </div>
          ))}
        </div></div>
      )}
    </div>
  );
}
