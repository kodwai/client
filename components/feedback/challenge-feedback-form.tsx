"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StarRating } from "./star-rating";

interface ChallengeFeedbackFormProps {
  challengeId: string;
  submissionId?: string;
}

function ChallengeFeedbackForm({ challengeId, submissionId }: ChallengeFeedbackFormProps) {
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingDifficulty, setRatingDifficulty] = useState(0);
  const [ratingClarity, setRatingClarity] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      try {
        const data = await api.get(`/api/challenges/${challengeId}/feedback/me`);
        if (data) {
          setRatingOverall(data.rating_overall);
          setRatingDifficulty(data.rating_difficulty || 0);
          setRatingClarity(data.rating_clarity || 0);
          setComment(data.comment || "");
          setSubmitted(true);
        }
      } catch {
        // No existing feedback
      } finally {
        setLoaded(true);
      }
    }
    loadExisting();
  }, [challengeId]);

  if (!loaded) return null;

  if (submitted && !editing) {
    return (
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg">Thanks for your feedback!</p>
            <p className="font-mono text-xs text-muted mt-1">
              You rated this challenge {ratingOverall}/5
            </p>
          </div>
          <Button variant="secondary" onClick={() => setEditing(true)} className="px-4 py-2">
            Edit
          </Button>
        </div>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (ratingOverall === 0) {
      setError("Please provide an overall rating.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/api/challenges/${challengeId}/feedback`, {
        rating_overall: ratingOverall,
        rating_difficulty: ratingDifficulty || null,
        rating_clarity: ratingClarity || null,
        comment: comment.trim() || null,
        submission_id: submissionId || null,
      });
      posthog.capture("challenge_feedback_submitted", {
        challenge_id: challengeId,
        rating_overall: ratingOverall,
        rating_difficulty: ratingDifficulty || null,
        rating_clarity: ratingClarity || null,
        has_comment: comment.trim().length > 0,
        is_update: editing,
      });
      setSubmitted(true);
      setEditing(false);
    } catch (err: any) {
      posthog.captureException(err);
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card accent className="mt-6">
      <h2 className="font-display text-xl mb-4">How was this challenge?</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <StarRating
          label="Overall Quality *"
          value={ratingOverall}
          onChange={setRatingOverall}
        />
        <StarRating
          label="Difficulty Accuracy"
          value={ratingDifficulty}
          onChange={setRatingDifficulty}
        />
        <StarRating
          label="Problem Clarity"
          value={ratingClarity}
          onChange={setRatingClarity}
        />
        <Textarea
          label="Comment"
          hint="Optional — share what you liked or what could be improved"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        {error && <p className="font-mono text-xs text-rust">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : submitted ? "Update Feedback" : "Submit Feedback"}
          </Button>
          {editing && (
            <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

export { ChallengeFeedbackForm };
