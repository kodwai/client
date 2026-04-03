"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function DevFeedbackPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/feedback/platform/me")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">My Feedback</h1>
      <p className="font-mono text-sm text-muted">Your submitted feedback and admin responses</p>
      <Divider className="mx-0 my-8" />

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No feedback yet</p>
          <p className="font-mono text-sm text-muted">
            Use the Feedback button in the sidebar to share your thoughts.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((fb: any) => (
            <Card key={fb.id} className={fb.admin_response ? "border-l-2 border-l-rust" : ""}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={categoryVariant[fb.category] || "info"}>
                  {categoryLabels[fb.category] || fb.category}
                </Badge>
                <Badge variant={statusVariant[fb.status] || "info"}>{fb.status}</Badge>
                {fb.rating && (
                  <span className="font-mono text-xs text-muted">{fb.rating}/5</span>
                )}
                <span className="font-mono text-[10px] text-muted ml-auto">{formatDate(fb.created_at)}</span>
              </div>
              <p className="font-mono text-sm whitespace-pre-wrap">{fb.description}</p>

              {fb.admin_response && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-rust mb-1">Admin Response</p>
                  <p className="font-mono text-sm">{fb.admin_response}</p>
                  {fb.admin_responded_at && (
                    <p className="font-mono text-[10px] text-muted mt-1">{formatDate(fb.admin_responded_at)}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
