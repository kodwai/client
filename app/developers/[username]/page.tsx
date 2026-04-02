"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const difficultyVariant: Record<string, "success" | "warning" | "error"> = {
  easy: "success", medium: "warning", hard: "error",
};

const BADGE_IMAGES: Record<string, string> = {
  "first-blood": "/badges/first-blood.png", "five-down": "/badges/five-down.png",
  "ten-strong": "/badges/ten-strong.png", "quarter-century": "/badges/quarter-century.png",
  "streak-3": "/badges/streak-3.png", "streak-7": "/badges/streak-7.png", "streak-30": "/badges/streak-30.png",
  "top-10": "/badges/top-10.png", "speed-demon": "/badges/speed-demon.png",
  "perfect-score": "/badges/perfect-score.png", "polyglot": "/badges/polyglot.png",
  "claude-master": "/badges/claude-master.png", "cursor-pro": "/badges/cursor-pro.png",
  "early-adopter": "/badges/early-adopter.png",
};

interface Profile {
  name: string;
  username: string;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  total_score: number;
  challenges_completed: number;
  rank: number | null;
  streak_days: number;
  preferred_agent: string | null;
  skills: string[];
  badges: any[];
  recent_submissions: any[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/developers/${username}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl mb-2">Developer not found</p>
          <Link href="/dev/leaderboard" className="font-mono text-sm text-rust">Back to leaderboard</Link>
        </div>
      </div>
    );
  }

  const avatarNum = (username.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 8) + 1;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/dev/leaderboard" className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block">
          &larr; Back to leaderboard
        </Link>

        <Card accent className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
              <img src={`/avatars/avatar-${avatarNum}.png`} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display text-xl">{profile.name}</p>
              <p className="font-mono text-sm text-muted">@{profile.username}</p>
              {profile.bio && <p className="font-mono text-xs text-muted mt-1">{profile.bio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="font-display text-2xl">{profile.challenges_completed}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Challenges</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl">{profile.total_score > 0 ? profile.total_score.toFixed(0) : "—"}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Score</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl">{profile.rank || "—"}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Rank</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl">{profile.preferred_agent || "—"}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Agent</p>
            </div>
          </div>

          {(profile.github_url || profile.linkedin_url || profile.website_url) && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-rust hover:text-rust-hover transition-colors">GitHub</a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-rust hover:text-rust-hover transition-colors">LinkedIn</a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-rust hover:text-rust-hover transition-colors">Website</a>
              )}
            </div>
          )}
        </Card>

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl mb-4">Badges</h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3 border border-rust/20 bg-rust/5">
                  {BADGE_IMAGES[b.slug] ? (
                    <img src={BADGE_IMAGES[b.slug]} alt={b.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-xl">🏅</span>
                  )}
                  <div>
                    <p className="font-display text-sm">{b.name}</p>
                    <p className="font-mono text-[10px] text-muted">{formatDate(b.earned_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.recent_submissions?.length > 0 && (
          <>
            <h2 className="font-display text-xl mb-4">Recent Submissions</h2>
            <div className="space-y-3">
              {profile.recent_submissions.map((s: any) => (
                <Card key={s.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-sm">{s.challenge_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={difficultyVariant[s.difficulty] || "info"}>{s.difficulty}</Badge>
                        {s.agent_used && <span className="font-mono text-[10px] uppercase text-muted">{s.agent_used}</span>}
                      </div>
                    </div>
                    {s.score != null && (
                      <span className={`font-display text-xl ${s.score >= 70 ? "text-green-700" : s.score >= 50 ? "text-amber-600" : "text-rust"}`}>
                        {s.score.toFixed(0)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
