"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { SocialLink } from "@/components/ui/social-link";

interface Profile {
  name: string;
  username: string;
  email: string;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  x_url: string | null;
  skills: string[];
  preferred_agent: string | null;
  total_score: number;
  challenges_completed: number;
  rank: number | null;
  streak_days: number;
  direction_rating: number;
  recent_submissions?: Submission[];
}

function normalizeXHandle(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@+/, "").replace(/\s+/g, "");
  if (!handle) return null;
  return `https://x.com/${handle}`;
}

interface Submission {
  id: string;
  score: number;
  agent_used: string;
  model_display?: string | null;
  challenge_title: string;
  challenge_slug: string;
  difficulty: string;
  scored_at: string;
}

const difficultyVariant: Record<string, "success" | "warning" | "error"> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [xHandle, setXHandle] = useState("");

  useEffect(() => {
    api.get("/api/developers/me")
      .then((data) => {
        setProfile(data);
        setBio(data.bio || "");
        setGithubUrl(data.github_url || "");
        setLinkedinUrl(data.linkedin_url || "");
        setWebsiteUrl(data.website_url || "");
        setXHandle(data.x_url || "");
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const data = await api.put("/api/developers/me", {
        bio: bio || null,
        github_url: githubUrl || null,
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
        x_url: normalizeXHandle(xHandle),
      });
      setProfile(data);
      setXHandle(data.x_url || "");
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="text-center py-12">
        <p className="font-display text-xl">Profile not found</p>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl">Profile</h1>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">Your public developer profile</p>
      <Divider className="mx-0 my-8" />

      {/* Header card */}
      <Card accent className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <ProfileAvatar name={profile.name} username={profile.username} size={64} />
          <div>
            <p className="font-display text-xl">{profile.name}</p>
            <p className="font-mono text-sm text-muted">@{profile.username}</p>
            {profile.bio && !editing && (
              <p className="font-mono text-xs text-muted mt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
          <div className="text-center">
            <p className="font-display text-2xl">{profile.direction_rating ?? 1000}</p>
            <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Direction</p>
          </div>
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
            <p className="font-display text-2xl">{profile.streak_days || 0}</p>
            <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Streak</p>
          </div>
        </div>

        {/* Links */}
        {!editing && (profile.github_url || profile.linkedin_url || profile.website_url || profile.x_url) && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border">
            {profile.github_url && <SocialLink kind="github" href={profile.github_url} />}
            {profile.x_url && <SocialLink kind="x" href={profile.x_url} />}
            {profile.linkedin_url && <SocialLink kind="linkedin" href={profile.linkedin_url} />}
            {profile.website_url && <SocialLink kind="website" href={profile.website_url} />}
          </div>
        )}
      </Card>

      {/* Edit form */}
      {editing && (
        <Card className="mb-6">
          <h2 className="font-display text-lg mb-4">Edit Profile</h2>
          <div className="space-y-4">
            <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself" />
            <Input label="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" />
            <Input label="X (Twitter)" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@yourhandle or https://x.com/yourhandle" />
            <Input label="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" />
            <Input label="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>
      )}

      {/* Badges */}
      <ProfileBadges />

      {/* Recent submissions */}
      <h2 className="font-display text-xl mb-4">Recent Submissions</h2>
      {profile.recent_submissions && profile.recent_submissions.length > 0 ? (
        <div className="space-y-3">
          {profile.recent_submissions.map((s) => (
            <Link key={s.id} href={`/dev/submissions/${s.id}`}>
              <Card className="hover:border-rust/30 transition-colors cursor-pointer mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm">{s.challenge_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={difficultyVariant[s.difficulty] || "info"}>{s.difficulty}</Badge>
                      {s.agent_used && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.model_display ? `${s.model_display} · ` : ""}{s.agent_used}</span>
                      )}
                    </div>
                  </div>
                  <p className="font-display text-xl">
                    <span className={s.score >= 70 ? "text-green-700" : s.score >= 50 ? "text-amber-600" : "text-rust"}>
                      {s.score?.toFixed(0)}
                    </span>
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="font-mono text-sm text-muted">No submissions yet.</p>
          <Link href="/dev/challenges" className="font-mono text-sm text-rust hover:text-rust-hover transition-colors mt-2 inline-block">
            Browse challenges &rarr;
          </Link>
        </Card>
      )}
    </div>
  );
}

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
  "early-adopter": "/badges/early-adopter.png",
};

function ProfileBadges() {
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/badges/me")
      .then(setBadges)
      .catch(() => setBadges([]));
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">Badges</h2>
        <Link href="/dev/badges" className="font-mono text-xs text-rust hover:text-rust-hover transition-colors">
          View all &rarr;
        </Link>
      </div>
      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {badges.map((b: any) => (
            <div key={b.id} className="flex items-center gap-3 px-4 py-3 border border-rust/20 bg-rust/5">
              {BADGE_IMAGES[b.slug] ? (
                <img src={BADGE_IMAGES[b.slug]} alt={b.name} className="w-12 h-12 object-contain" />
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
      ) : (
        <p className="font-mono text-sm text-muted">No badges earned yet. Complete challenges to earn badges!</p>
      )}
    </div>
  );
}

function ProfileAvatar({ name, username, size = 64 }: { name: string; username: string; size?: number }) {
  // Deterministic avatar based on username hash
  const hash = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const avatarNum = (hash % 8) + 1;
  const avatarSrc = `/avatars/avatar-${avatarNum}.png`;

  return (
    <div
      className="rounded-full overflow-hidden border-2 border-border flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <img src={avatarSrc} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}
