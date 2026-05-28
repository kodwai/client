"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";

const categoryOptions = [
  { value: "general", label: "General Feedback" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "improvement", label: "Improvement Suggestion" },
];

interface PlatformFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

function PlatformFeedbackModal({ open, onClose }: PlatformFeedbackModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Reset form when reopened
  useEffect(() => {
    if (open) {
      setCategory("general");
      setDescription("");
      setRating(0);
      setError("");
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (description.trim().length < 10) {
      setError("Please provide at least 10 characters of description.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/feedback/platform", {
        category,
        description: description.trim(),
        rating: rating || null,
        page_url: typeof window !== "undefined" ? window.location.pathname : null,
      });
      posthog.capture("platform_feedback_submitted", {
        category,
        has_rating: rating > 0,
        rating: rating || null,
      });
      setSubmitted(true);
    } catch (err: any) {
      posthog.captureException(err);
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white/95 border border-border p-6 sm:p-8 w-full max-w-lg mx-4 border-l-2 border-l-rust">
        {submitted ? (
          <div className="text-center py-4">
            <p className="font-display text-xl mb-2">Thanks for your feedback!</p>
            <p className="font-mono text-sm text-muted mb-6">
              Your feedback helps us improve Kodwai.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl mb-1">Share Feedback</h2>
            <p className="font-mono text-xs text-muted mb-6">
              Help us improve Kodwai — report bugs, request features, or share your thoughts.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
              />
              <Textarea
                label="Description *"
                hint="Minimum 10 characters"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Tell us what's on your mind..."
              />
              <StarRating
                label="Overall Experience (optional)"
                value={rating}
                onChange={setRating}
              />
              {error && <p className="font-mono text-xs text-rust">{error}</p>}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Feedback"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export { PlatformFeedbackModal };
