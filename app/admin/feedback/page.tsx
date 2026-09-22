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

  const handleReplySent = ({ message, emailed }: ReplyOutcome) => {
    setStatus("resolved");
    onUpdate({
      ...feedback,
      status: "resolved",
      admin_response: message,
      reply_emailed_at: emailed ? new Date().toISOString() : feedback.reply_emailed_at,
    });
  };

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
              {feedback.reply_emailed_at && <RepliedTag at={feedback.reply_emailed_at} />}
            </div>
            <p className="font-mono text-sm truncate">{feedback.description}</p>
            <p className="font-mono text-[10px] text-muted mt-1">
              {feedback.user_name} ({feedback.user_email}) · {formatDate(feedback.created_at)}
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
            hint="Save stores it without emailing. Send reply email shows a preview, then emails it on confirm."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            placeholder="Optional response..."
          />
          <div className="flex flex-wrap gap-3 items-start">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          <ReplyEmailAction
            kind="platform"
            id={feedback.id}
            recipient={feedback.user_email}
            message={response}
            onSent={handleReplySent}
          />
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
            <ChallengeFeedbackRow
              key={fb.id}
              feedback={fb}
              onUpdate={(updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface ChallengeFeedback {
  id: string;
  user_name: string;
  user_email: string;
  challenge_title: string;
  rating_overall: number;
  rating_difficulty: number | null;
  rating_clarity: number | null;
  comment: string | null;
  created_at: string;
  status?: string;
  admin_response?: string | null;
  reply_emailed_at?: string | null;
}

function ChallengeFeedbackRow({
  feedback: fb,
  onUpdate,
}: {
  feedback: ChallengeFeedback;
  onUpdate: (fb: ChallengeFeedback) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [message, setMessage] = useState(fb.admin_response || "");

  const handleReplySent = ({ message: sent, emailed }: ReplyOutcome) => {
    onUpdate({
      ...fb,
      status: "resolved",
      admin_response: sent,
      reply_emailed_at: emailed ? new Date().toISOString() : fb.reply_emailed_at,
    });
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="grid grid-cols-12 gap-2 px-4 py-3">
        <div className="col-span-2">
          <p className="font-display text-sm truncate">{fb.user_name}</p>
          <p className="font-mono text-[10px] text-muted truncate">{fb.user_email}</p>
        </div>
        <span className="col-span-2 font-mono text-xs text-muted self-center truncate">{fb.challenge_title}</span>
        <span className="col-span-1 font-display text-sm text-center self-center">{fb.rating_overall}/5</span>
        <span className="col-span-1 font-mono text-xs text-muted text-center self-center">{fb.rating_difficulty ?? "-"}</span>
        <span className="col-span-1 font-mono text-xs text-muted text-center self-center">{fb.rating_clarity ?? "-"}</span>
        <span className="col-span-3 font-mono text-xs text-muted self-center truncate">{fb.comment || "-"}</span>
        <div className="col-span-2 text-right self-center space-y-1">
          <p className="font-mono text-[10px] text-muted">{formatDate(fb.created_at)}</p>
          {fb.reply_emailed_at && <RepliedTag at={fb.reply_emailed_at} />}
          <button
            type="button"
            onClick={() => setReplyOpen(!replyOpen)}
            className="block ml-auto font-mono text-[10px] uppercase tracking-widest text-rust hover:text-rust-hover transition-colors"
          >
            {replyOpen ? "Close" : "Reply"}
          </button>
        </div>
      </div>

      {replyOpen && (
        <div className="px-4 pb-4 space-y-4">
          {fb.comment && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Comment</p>
              <p className="font-mono text-sm whitespace-pre-wrap">{fb.comment}</p>
            </div>
          )}
          <Textarea
            label="Reply"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Write your reply to the developer..."
          />
          <ReplyEmailAction
            kind="challenges"
            id={fb.id}
            recipient={fb.user_email}
            message={message}
            onSent={handleReplySent}
          />
        </div>
      )}
    </div>
  );
}

// ── Reply by email ─────────────────────────────────────────────────

interface ReplyOutcome {
  message: string;
  emailed: boolean;
}

interface ReplyResponse {
  ok: boolean;
  dry_run: boolean;
  email_send_id: string | null;
  email_status?: string | null;
  email_reason?: string | null;
  preview?: { subject: string; text: string } | null;
}

function RepliedTag({ at }: { at: string }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-green-700">
      Replied {formatDate(at)}
    </span>
  );
}

/**
 * Emails the user a reply to their feedback and marks it resolved. Always shows
 * a dry-run preview first; the real send needs a second, explicit click, and
 * editing the message afterwards discards the preview.
 */
function ReplyEmailAction({
  kind,
  id,
  recipient,
  message,
  onSent,
}: {
  kind: "platform" | "challenges";
  id: string;
  recipient: string;
  message: string;
  onSent: (outcome: ReplyOutcome) => void;
}) {
  const [preview, setPreview] = useState<{ subject: string; text: string } | null>(null);
  const [previewedMessage, setPreviewedMessage] = useState("");
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const trimmed = message.trim();
  const showPreview = preview !== null && previewedMessage === trimmed;

  const post = async (dryRun: boolean): Promise<ReplyResponse> =>
    adminApi.post(`/api/admin/feedback/${kind}/${id}/reply`, {
      message: trimmed,
      send_email: true,
      status: "resolved",
      dry_run: dryRun,
    });

  const handlePreview = async () => {
    setBusy("preview");
    setError("");
    setResult("");
    try {
      const res = await post(true);
      setPreview(res.preview ?? { subject: "(no subject returned)", text: trimmed });
      setPreviewedMessage(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(null);
    }
  };

  const handleSend = async () => {
    setBusy("send");
    setError("");
    try {
      const res = await post(false);
      if (res.ok === false) {
        // The API saves nothing when the email is refused or fails, so the item stays unreplied.
        setError(
          `Not sent and not saved (${res.email_status ?? "refused"}${res.email_reason ? `: ${res.email_reason}` : ""}).`,
        );
        return;
      }
      const emailed = !!res.email_send_id;
      setPreview(null);
      setResult(
        emailed
          ? `Reply emailed to ${recipient}. Marked resolved.`
          : "Saved and marked resolved, but no new email went out. This exact reply may have been sent already.",
      );
      onSent({ message: trimmed, emailed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {!showPreview && (
        <Button variant="secondary" onClick={handlePreview} disabled={!trimmed || busy !== null}>
          {busy === "preview" ? "Preparing preview..." : "Send reply email"}
        </Button>
      )}

      {showPreview && preview && (
        <div className="border border-border bg-white/60 p-4 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Preview · nothing sent yet
          </p>
          <p className="font-mono text-xs text-muted">To: {recipient}</p>
          <p className="font-display text-base">{preview.subject}</p>
          <pre className="font-mono text-xs whitespace-pre-wrap text-ink/80 max-h-80 overflow-auto">{preview.text}</pre>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSend} disabled={busy !== null}>
              {busy === "send" ? "Sending..." : "Confirm and send"}
            </Button>
            <Button variant="secondary" onClick={() => setPreview(null)} disabled={busy !== null}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="font-mono text-xs text-rust">{error}</p>}
      {result && <p className="font-mono text-xs text-green-700">{result}</p>}
    </div>
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
