"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

const categoryLabels: Record<string, string> = {
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  general: "General",
  improvement: "Improvement",
};

const categoryVariant: Record<string, "error" | "info" | "success" | "warning"> = {
  bug_report: "error",
  feature_request: "info",
  general: "success",
  improvement: "warning",
};

const statusVariant: Record<string, "success" | "info" | "warning" | "error"> = {
  new: "warning",
  reviewed: "info",
  resolved: "success",
  dismissed: "error",
};

type Tab = "platform" | "challenges" | "analytics";

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<Tab>("platform");

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Feedback</h1>
      <p className="text-muted font-mono text-sm mb-2">User feedback and ratings</p>
      <Divider className="mx-0 my-6" />

      <div className="flex gap-4 mb-6 border-b border-border">
        {(["platform", "challenges", "analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              tab === t ? "text-rust border-b-2 border-rust" : "text-muted hover:text-ink"
            }`}
          >
            {t === "platform" ? "Platform" : t === "challenges" ? "Challenge Ratings" : "Analytics"}
          </button>
        ))}
      </div>

      {tab === "platform" && <PlatformFeedbackTab />}
      {tab === "challenges" && <ChallengeFeedbackTab />}
      {tab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

// ── Platform Feedback Tab ──────────────────────────────────────────

function PlatformFeedbackTab() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (statusFilter) params.set("status", statusFilter);
    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/feedback/platform?${params}`)
        .then((data) => { setItems(data?.items || []); setTotal(data?.total || 0); })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter]);

  return (
    <>
      <p className="font-mono text-xs text-muted mb-4">{total} total</p>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input label="" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All categories</option>
          <option value="bug_report">Bug Report</option>
          <option value="feature_request">Feature Request</option>
          <option value="general">General</option>
          <option value="improvement">Improvement</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border bg-transparent font-mono text-sm">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No feedback found</p></Card>
      ) : (
        <div className="space-y-3">
          {items.map((fb: any) => (
            <PlatformFeedbackRow
              key={fb.id}
              feedback={fb}
              expanded={expanded === fb.id}
              onToggle={() => setExpanded(expanded === fb.id ? null : fb.id)}
              onUpdate={(updated) => setItems(items.map((i) => i.id === updated.id ? updated : i))}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PlatformFeedbackRow({
  feedback,
  expanded,
  onToggle,
  onUpdate,
}: {
  feedback: any;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (fb: any) => void;
}) {
  const [status, setStatus] = useState(feedback.status);
  const [response, setResponse] = useState(feedback.admin_response || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.put(`/api/admin/feedback/platform/${feedback.id}`, {
        status,
        admin_response: response.trim() || null,
      });
      onUpdate(updated);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={feedback.is_flagged ? "border-l-2 border-l-rust" : ""}>
      <div className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={categoryVariant[feedback.category] || "info"}>
                {categoryLabels[feedback.category] || feedback.category}
              </Badge>
              <Badge variant={statusVariant[feedback.status] || "info"}>{feedback.status}</Badge>
              {feedback.rating && (
                <span className="font-mono text-xs text-muted">{feedback.rating}/5</span>
              )}
            </div>
            <p className="font-mono text-sm truncate">{feedback.description}</p>
            <p className="font-mono text-[10px] text-muted mt-1">
              {feedback.user_name} ({feedback.user_email}) — {formatDate(feedback.created_at)}
            </p>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={`flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Full Description</p>
            <p className="font-mono text-sm whitespace-pre-wrap">{feedback.description}</p>
          </div>
          {feedback.page_url && (
            <p className="font-mono text-[10px] text-muted">Page: {feedback.page_url}</p>
          )}
          <div className="flex gap-3 items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-border bg-transparent font-mono text-sm"
              >
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
          <Textarea
            label="Admin Response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            placeholder="Optional response..."
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── Challenge Feedback Tab ─────────────────────────────────────────

function ChallengeFeedbackTab() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const timer = setTimeout(() => {
      adminApi.get(`/api/admin/feedback/challenges?${params}`)
        .then((data) => { setItems(data?.items || []); setTotal(data?.total || 0); })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <p className="font-mono text-xs text-muted mb-4">{total} total</p>
      <div className="mb-6 max-w-md">
        <Input label="" placeholder="Search by user or comment..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No challenge feedback found</p></Card>
      ) : (
        <div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-2">Developer</span>
            <span className="col-span-2">Challenge</span>
            <span className="col-span-1 text-center">Overall</span>
            <span className="col-span-1 text-center">Difficulty</span>
            <span className="col-span-1 text-center">Clarity</span>
            <span className="col-span-3">Comment</span>
            <span className="col-span-2 text-right">Date</span>
          </div>
          {items.map((fb: any) => (
            <div key={fb.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0">
              <div className="col-span-2">
                <p className="font-display text-sm truncate">{fb.user_name}</p>
                <p className="font-mono text-[10px] text-muted truncate">{fb.user_email}</p>
              </div>
              <span className="col-span-2 font-mono text-xs text-muted self-center truncate">{fb.challenge_title}</span>
              <span className="col-span-1 font-display text-sm text-center self-center">{fb.rating_overall}/5</span>
              <span className="col-span-1 font-mono text-xs text-muted text-center self-center">{fb.rating_difficulty ?? "—"}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-center self-center">{fb.rating_clarity ?? "—"}</span>
              <span className="col-span-3 font-mono text-xs text-muted self-center truncate">{fb.comment || "—"}</span>
              <span className="col-span-2 font-mono text-[10px] text-muted text-right self-center">{formatDate(fb.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/api/admin/feedback/analytics")
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>;
  if (!analytics) return <Card className="text-center py-12"><p className="font-mono text-sm text-muted">Failed to load analytics</p></Card>;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Challenge Reviews</p>
          <p className="font-display text-2xl">{analytics.challenge_feedback.total}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Platform Feedback</p>
          <p className="font-display text-2xl">{analytics.platform_feedback.total}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Bug Reports</p>
          <p className="font-display text-2xl">{analytics.platform_feedback.by_category?.bug_report || 0}</p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Feature Requests</p>
          <p className="font-display text-2xl">{analytics.platform_feedback.by_category?.feature_request || 0}</p>
        </Card>
      </div>

      {/* Platform status breakdown */}
      <Card>
        <h2 className="font-display text-lg mb-3">Platform Feedback by Status</h2>
        <div className="flex gap-6 flex-wrap">
          {Object.entries(analytics.platform_feedback.by_status || {}).map(([status, count]) => (
            <div key={status} className="text-center">
              <p className="font-display text-xl">{count as number}</p>
              <Badge variant={statusVariant[status] || "info"}>{status}</Badge>
            </div>
          ))}
          {Object.keys(analytics.platform_feedback.by_status || {}).length === 0 && (
            <p className="font-mono text-xs text-muted">No data yet</p>
          )}
        </div>
      </Card>

      {/* Per-challenge ratings */}
      {analytics.challenge_feedback.per_challenge.length > 0 && (
        <Card>
          <h2 className="font-display text-lg mb-3">Challenge Ratings</h2>
          <div className="border border-border">
            <div className="hidden sm:grid grid-cols-10 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span className="col-span-3">Challenge</span>
              <span className="col-span-2 text-center">Avg Overall</span>
              <span className="col-span-2 text-center">Avg Difficulty</span>
              <span className="col-span-2 text-center">Avg Clarity</span>
              <span className="col-span-1 text-right">Reviews</span>
            </div>
            {analytics.challenge_feedback.per_challenge.map((ch: any) => (
              <div key={ch.challenge_id} className="grid grid-cols-10 gap-2 px-4 py-3 border-b border-border last:border-b-0">
                <span className="col-span-3 font-display text-sm truncate">{ch.challenge_title}</span>
                <span className="col-span-2 font-mono text-sm text-center">{ch.avg_overall ?? "—"}</span>
                <span className="col-span-2 font-mono text-sm text-muted text-center">{ch.avg_difficulty ?? "—"}</span>
                <span className="col-span-2 font-mono text-sm text-muted text-center">{ch.avg_clarity ?? "—"}</span>
                <span className="col-span-1 font-mono text-sm text-muted text-right">{ch.total_count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
