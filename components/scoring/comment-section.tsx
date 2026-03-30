"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  sessionId: string;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentSection({ sessionId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchComments = useCallback(() => {
    api
      .get(`/api/sessions/${sessionId}/comments`)
      .then((data) => {
        setComments(data.comments || data || []);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Load current user
  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((data) => setCurrentUserId(data.id))
      .catch(() => {});
  }, []);

  // Load comments + poll every 10s
  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/api/sessions/${sessionId}/comments`, {
        content: newComment.trim(),
      });
      setNewComment("");
      fetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await api.delete(`/api/sessions/${sessionId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  }

  return (
    <Card>
      <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-4">
        Comments
      </label>

      {error && <p className="font-mono text-xs text-rust mb-3">{error}</p>}

      {loading ? (
        <p className="font-mono text-sm text-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted mb-4">No comments yet.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border-l-2 border-border pl-3 py-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm text-ink">
                    {comment.user_name}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {formatTimestamp(comment.created_at)}
                  </span>
                </div>
                {currentUserId === comment.user_id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="font-mono text-[10px] text-muted hover:text-rust transition-colors uppercase tracking-widest"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-ink/80 mt-1 leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          placeholder="Add a comment..."
          className="w-full border border-border bg-transparent p-3 font-mono text-sm text-ink outline-none focus:border-rust resize-y placeholder:text-muted/50"
        />
        <Button type="submit" variant="secondary" disabled={submitting || !newComment.trim()}>
          {submitting ? "Posting..." : "Add Comment"}
        </Button>
      </form>
    </Card>
  );
}

export { CommentSection };
export type { Comment };
