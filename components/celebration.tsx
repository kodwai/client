"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export interface CelebrationData {
  score: number;
  personal_best: boolean;
  new_badges: { slug: string; name: string; icon?: string | null; description?: string | null }[];
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Fire confetti scaled to score; extra burst for a personal best or new badges. */
function fireConfetti(data: CelebrationData) {
  if (prefersReducedMotion()) return;
  // No confetti for a plain low score with nothing special to celebrate.
  if (data.score < 50 && !data.personal_best && data.new_badges.length === 0) return;
  const particleCount = data.score >= 80 ? 160 : data.score >= 50 ? 90 : 40;
  confetti({ particleCount, spread: 75, origin: { y: 0.3 }, scalar: 0.9 });
  if (data.personal_best || data.new_badges.length > 0) {
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 }, startVelocity: 45 }), 250);
  }
}

/**
 * Plays the celebration once on mount: confetti + a badge-unlock card per new
 * badge + a personal-best ribbon. Render only when the moment should play.
 */
export function Celebration({ data }: { data: CelebrationData }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fireConfetti(data);
  }, [data]);

  if (data.new_badges.length === 0 && !data.personal_best) return null;

  return (
    <div className="my-4 flex flex-col gap-2" role="status" aria-live="polite">
      {data.personal_best && (
        <div className="font-mono text-xs uppercase tracking-widest text-green-700">★ Personal best</div>
      )}
      {data.new_badges.map((b) => (
        <div key={b.slug} className="flex items-center gap-3 border border-border bg-white/50 p-3">
          <img src={`/badges/${b.slug}.png`} alt={b.name} className="w-10 h-10 object-contain" />
          <div>
            <div className="font-display text-sm">Badge unlocked — {b.name}</div>
            {b.description && <div className="font-mono text-xs text-muted">{b.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
