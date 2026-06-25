"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ActiveSubmission {
  id: string;
  challenge_title: string;
}

/**
 * Surfaces the developer's single in-progress challenge (one at a time) with a
 * way to stop it. Renders nothing when there is no active challenge. Stopping
 * deletes the in-progress submission, freeing the slot to start another.
 */
export function ActiveChallengeBanner() {
  const [active, setActive] = useState<ActiveSubmission | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    api
      .get("/api/submissions/active")
      .then((d) => setActive(d || null))
      .catch(() => setActive(null));
  }, []);

  async function handleStop() {
    if (!active) return;
    setStopping(true);
    try {
      await api.delete(`/api/submissions/${active.id}`);
      setActive(null);
      setConfirmStop(false);
    } catch {
      // Close the confirm so it isn't stuck; the banner stays so they can retry.
      setConfirmStop(false);
    } finally {
      setStopping(false);
    }
  }

  if (!active) return null;

  return (
    <>
      <div className="mb-8 p-4 border-l-2 border-rust bg-rust/5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-rust mb-1">
            Challenge in progress
          </p>
          <p className="font-display text-lg truncate">{active.challenge_title}</p>
          <p className="font-mono text-xs text-muted mt-0.5">
            One challenge at a time. Finish or stop this one to start another.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href={`/dev/submissions/${active.id}`}
            className="font-mono text-xs uppercase tracking-widest text-rust hover:text-rust-hover transition-colors whitespace-nowrap"
          >
            View &rarr;
          </Link>
          <Button variant="secondary" onClick={() => setConfirmStop(true)}>
            Stop
          </Button>
        </div>
      </div>

      <Modal
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title="Stop this challenge?"
        description="This abandons your in-progress attempt and deletes it. You can start a new challenge afterwards. This can't be undone."
        confirmLabel="Stop challenge"
        onConfirm={handleStop}
        loading={stopping}
      />
    </>
  );
}
