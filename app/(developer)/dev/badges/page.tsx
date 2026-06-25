"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";

interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  earned_count: number;
  earned_percentage: number;
}

interface EarnedBadge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface BadgeProgress {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  progressable: boolean;
  current: number;
  target: number;
}

// Badge slug -> image path mapping
const BADGE_IMAGES: Record<string, string> = {
  "first-blood": "/badges/first-blood.png",
  "five-down": "/badges/five-down.png",
  "ten-strong": "/badges/ten-strong.png",
  "quarter-century": "/badges/quarter-century.png",
  "streak-3": "/badges/streak-3.png",
  "streak-7": "/badges/streak-7.png",
  "streak-30": "/badges/streak-30.png",
  "top-10": "/badges/top-10.png",
  "speed-demon": "/badges/speed-demon.png",
  "perfect-score": "/badges/perfect-score.png",
  "polyglot": "/badges/polyglot.png",
  "claude-master": "/badges/claude-master.png",
  "cursor-pro": "/badges/cursor-pro.png",
  "codex-pro": "/badges/codex-pro.png",
  "early-adopter": "/badges/early-adopter.png",
};

const CATEGORY_LABELS: Record<string, string> = {
  milestone: "Milestones",
  skill: "Skill",
  streak: "Streaks",
  special: "Special",
};

export default function BadgesPage() {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<EarnedBadge[]>([]);
  const [progress, setProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/badges").catch(() => []),
      api.get("/api/badges/me").catch(() => []),
      api.get("/api/badges/progress").catch(() => []),
    ]).then(([all, mine, prog]) => {
      setAllBadges(all);
      setMyBadges(mine);
      setProgress(prog);
    }).finally(() => setLoading(false));
  }, []);

  const earnedSlugs = new Set(myBadges.map((b) => b.slug));
  const progressBySlug = new Map(progress.map((p) => [p.slug, p]));

  // Define display order per slug
  const SORT_ORDER: Record<string, number> = {
    "first-blood": 1, "five-down": 2, "ten-strong": 3, "quarter-century": 4,
    "top-10": 1, "speed-demon": 2, "perfect-score": 3, "polyglot": 4,
    "streak-3": 1, "streak-7": 2, "streak-30": 3,
    "claude-master": 1, "cursor-pro": 2, "codex-pro": 3, "early-adopter": 4,
  };

  const grouped: Record<string, Badge[]> = {};
  for (const badge of allBadges) {
    if (!grouped[badge.category]) grouped[badge.category] = [];
    grouped[badge.category].push(badge);
  }
  // Sort within each category
  for (const badges of Object.values(grouped)) {
    badges.sort((a, b) => (SORT_ORDER[a.slug] || 99) - (SORT_ORDER[b.slug] || 99));
  }

  const SHARE_COPY: Record<string, string> = {
    "first-blood": "Just drew first blood on @kodwai_com. First AI-agent coding challenge complete. The future of coding isn't writing code — it's directing AI to write it for you.",
    "five-down": "5 AI-agent coding challenges done on @kodwai_com. Getting better at making AI do the heavy lifting. This is the new meta.",
    "ten-strong": "10 challenges deep on @kodwai_com. If you're not practicing AI-agent coding, you're already behind.",
    "quarter-century": "25 challenges completed on @kodwai_com. I don't just use AI coding agents — I've mastered them.",
    "streak-3": "3-day streak on @kodwai_com. Building the muscle of AI-agent coding, one challenge at a time.",
    "streak-7": "7 days straight solving AI-agent challenges on @kodwai_com. This is what daily practice looks like in 2026.",
    "streak-30": "30-day streak on @kodwai_com. A full month of AI-agent coding challenges without missing a day. Built different.",
    "top-10": "Just cracked the top 10% on @kodwai_com. Competing against other devs on who can wield AI agents best. This is the new leaderboard.",
    "speed-demon": "Finished an AI-agent challenge in under half the time limit on @kodwai_com. Speed + AI = unstoppable.",
    "perfect-score": "95+ on an AI-agent coding challenge on @kodwai_com. Near-perfect execution. The bar is set.",
    "polyglot": "Completed AI-agent challenges across 3+ categories on @kodwai_com — backend, frontend, algorithms. Full stack AI wielder.",
    "claude-master": "Scored 80+ on 5 challenges using Claude Code on @kodwai_com. If Claude is the tool, I'm the craftsman.",
    "cursor-pro": "Scored 80+ on 5 challenges using Cursor on @kodwai_com. Cursor + me = shipping machine.",
    "codex-pro": "Scored 80+ on 5 challenges using Codex on @kodwai_com. Terminal-native, fully agentic.",
    "early-adopter": "Early adopter on @kodwai_com — the platform that scores how well you use AI coding agents. The future of technical interviews is here.",
  };

  function handleShare(badge: EarnedBadge, platform: "twitter" | "linkedin") {
    const badgeUrl = `${window.location.origin}/badges/${badge.slug}`;
    const copy = SHARE_COPY[badge.slug] || `I just earned the "${badge.name}" badge on @kodwai_com — ${badge.description}`;
    const hashtags = "kodwai,AIcoding,CodingChallenge";

    if (platform === "twitter") {
      const tweetText = `${copy}\n\n#kodwai #AIcoding`;
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(badgeUrl)}&text=${encodeURIComponent(tweetText)}`, "_blank");
    } else {
      // LinkedIn uses OG tags from the URL for the card — the text is pre-filled in the share dialog
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(badgeUrl)}`, "_blank");
    }
    setShareToast(`Sharing ${badge.name}...`);
    setTimeout(() => setShareToast(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Badges</h1>
      <p className="text-muted font-mono text-sm mb-2">
        {myBadges.length} of {allBadges.length} earned
      </p>
      <Divider className="mx-0 my-8" />

      {/* Share toast */}
      {shareToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-rust text-white font-mono text-sm animate-fade-in">
          {shareToast}
        </div>
      )}

      {["milestone", "skill", "streak", "special"].filter(c => grouped[c]).map((category) => {
        const badges = grouped[category];
        return (
        <div key={category} className="mb-10">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
            {CATEGORY_LABELS[category] || category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const earned = earnedSlugs.has(badge.slug);
              const earnedBadge = myBadges.find((b) => b.slug === badge.slug);
              const prog = progressBySlug.get(badge.slug);
              const showProgress =
                !earned && prog?.progressable && prog.target > 0;
              const progressPct = showProgress
                ? Math.min(prog!.current / prog!.target, 1) * 100
                : 0;
              return (
                <div
                  key={badge.id}
                  className={`relative border text-center py-8 px-5 transition-all ${
                    earned
                      ? "border-rust bg-gradient-to-b from-rust/8 to-transparent shadow-[0_0_20px_rgba(194,54,22,0.12)]"
                      : "border-border/60 opacity-60"
                  }`}
                >
                  {/* Earned indicator */}
                  {earned && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rust" />
                  )}

                  <div className="mb-3 flex justify-center">
                    {BADGE_IMAGES[badge.slug] ? (
                      <img src={BADGE_IMAGES[badge.slug]} alt={badge.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <span className="text-4xl">🏅</span>
                    )}
                  </div>
                  <p className="font-display text-lg mb-1">{badge.name}</p>
                  <p className="font-mono text-xs text-muted leading-relaxed mb-3">
                    {badge.description}
                  </p>

                  {earned && earnedBadge ? (
                    <div>
                      <p className="font-mono text-xs text-rust font-bold mb-3">
                        Earned {formatDate(earnedBadge.earned_at)}
                      </p>
                      {/* Share buttons */}
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleShare(earnedBadge, "twitter")}
                          className="cursor-pointer px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest text-muted hover:text-white hover:bg-black hover:border-black transition-colors"
                        >
                          Share on X
                        </button>
                        <button
                          onClick={() => handleShare(earnedBadge, "linkedin")}
                          className="cursor-pointer px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest text-muted hover:text-white hover:bg-[#0a66c2] hover:border-[#0a66c2] transition-colors"
                        >
                          LinkedIn
                        </button>
                      </div>
                    </div>
                  ) : showProgress ? (
                    <div>
                      <div className="h-1 w-full bg-border overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-rust transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="font-mono text-[10px] text-muted">
                        {prog!.current} / {prog!.target}
                      </p>
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-muted/70">
                      {badge.earned_percentage > 0 ? `${badge.earned_percentage}% of developers` : "Locked"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}
