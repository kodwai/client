"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

export default function AdminSystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [auditPage, setAuditPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    adminApi.get("/api/admin/system/health")
      .then(setHealth).catch(() => setHealth(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(auditPage));
    if (actionFilter) params.set("action", actionFilter);
    adminApi.get(`/api/admin/audit-log?${params}`)
      .then((data) => { setAuditLog(data?.entries || []); setAuditTotal(data?.total || 0); })
      .catch(() => setAuditLog([]));
  }, [auditPage, actionFilter]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">System</h1>
      <p className="text-muted font-mono text-sm mb-2">Health check and audit log</p>
      <Divider className="mx-0 my-6" />

      {/* Health */}
      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-8">Loading...</p>
      ) : health ? (
        <div className="mb-8">
          <h2 className="font-display text-lg mb-3">Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <Card>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Status</p>
              <Badge variant={health.status === "ok" ? "success" : "error"}>{health.status}</Badge>
            </Card>
            <Card>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Database</p>
              <p className="font-mono text-sm">{health.database}</p>
            </Card>
            <Card>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Last Migration</p>
              <p className="font-mono text-xs">{health.last_migration?.name || "—"}</p>
              <p className="font-mono text-[10px] text-muted">{health.last_migration?.applied_at || ""}</p>
            </Card>
          </div>

          {health.table_counts && (
            <Card>
              <h3 className="font-display text-base mb-3">Table Row Counts</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Object.entries(health.table_counts).map(([table, count]: [string, any]) => (
                  <div key={table}>
                    <p className="font-mono text-[10px] text-muted">{table}</p>
                    <p className="font-display text-lg">{count}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="mb-8 text-center py-8"><p className="font-mono text-sm text-rust">Health check failed</p></Card>
      )}

      {/* Audit Log */}
      <h2 className="font-display text-lg mb-3">Audit Log ({auditTotal})</h2>

      <div className="mb-4">
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setAuditPage(1); }} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All actions</option>
          <option value="ban_user">Ban user</option>
          <option value="unban_user">Unban user</option>
          <option value="verify_email">Verify email</option>
          <option value="change_role">Change role</option>
          <option value="toggle_superadmin">Toggle superadmin</option>
          <option value="toggle_publish">Toggle publish</option>
          <option value="toggle_feature">Toggle feature</option>
          <option value="delete_challenge">Delete challenge</option>
          <option value="create_challenge">Create challenge</option>
          <option value="update_challenge">Update challenge</option>
          <option value="end_session">End session</option>
          <option value="rescore_submission">Rescore submission</option>
          <option value="deactivate_key">Deactivate key</option>
          <option value="create_badge">Create badge</option>
          <option value="update_badge">Update badge</option>
          <option value="toggle_badge">Toggle badge</option>
          <option value="recalculate_ranks">Recalculate ranks</option>
        </select>
      </div>

      {auditLog.length === 0 ? (
        <Card className="text-center py-8"><p className="font-mono text-sm text-muted">No audit log entries</p></Card>
      ) : (
        <>
          <div className="admin-table-scroll"><div className="border border-border">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span className="col-span-2">Time</span>
              <span className="col-span-2">Admin</span>
              <span className="col-span-2">Action</span>
              <span className="col-span-2">Entity</span>
              <span className="col-span-4">Details</span>
            </div>
            {auditLog.map((entry: any) => (
              <div key={entry.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0">
                <span className="col-span-2 font-mono text-[10px] text-muted">{formatDateTime(entry.created_at)}</span>
                <span className="col-span-2 font-mono text-xs truncate">{entry.admin_name}</span>
                <span className="col-span-2"><Badge variant="default">{entry.action}</Badge></span>
                <span className="col-span-2 font-mono text-[10px] text-muted">{entry.entity_type}:{entry.entity_id?.slice(0, 8)}</span>
                <span className="col-span-4 font-mono text-[10px] text-muted truncate">
                  {typeof entry.details === "object" ? JSON.stringify(entry.details) : entry.details}
                </span>
              </div>
            ))}
          </div></div>

          {auditTotal > 50 && (
            <div className="flex justify-center gap-4 mt-4">
              <button disabled={auditPage <= 1} onClick={() => setAuditPage(auditPage - 1)} className="font-mono text-xs text-muted hover:text-ink disabled:opacity-30">&larr; Prev</button>
              <span className="font-mono text-xs text-muted">Page {auditPage}</span>
              <button disabled={auditPage * 50 >= auditTotal} onClick={() => setAuditPage(auditPage + 1)} className="font-mono text-xs text-muted hover:text-ink disabled:opacity-30">Next &rarr;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
