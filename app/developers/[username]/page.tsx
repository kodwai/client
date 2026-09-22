import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateCustom } from "@/lib/date";
import { badgeImage } from "@/lib/badges";
import { API_URL } from "@/lib/site";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialLink } from "@/components/ui/social-link";
import { TierBadge } from "@/components/tier-badge";
import { MasteryRadar } from "@/components/mastery-radar";

const difficultyVariant: Record<string, "success" | "warning" | "error"> = {
  easy: "success", medium: "warning", hard: "error",
};

interface EarnedBadge {
  id: string;
  slug: string;
  name: string;
  earned_at: string;
}

interface RecentSubmission {
  id: string;
  challenge_title: string;
  difficulty: string;
  agent_used: string | null;
  score: number | null;
}

interface Profile {
  name: string;
  username: string;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  x_url: string | null;
  total_score: number;
  challenges_completed: number;
  rank: number | null;
  preferred_agent: string | null;
  badges: EarnedBadge[];
  recent_submissions: RecentSubmission[];
  direction_rating?: number;
  efficiency_rating?: number;
  tier?: { key: string; name: string; color: string; next_name?: string | null; next_at?: number | null; progress?: number } | null;
  level?: { level: number; xp: number; level_floor: number; next_level_xp: number; progress: number };
}

interface Skills {
  category: { key: string; rating: number }[];
  model: { key: string; rating: number }[];
}

// Returns null only when the developer does not exist (API 404). Any other
// failure throws, so an API outage renders the error page instead of a soft 404.
async function getProfile(username: string): Promise<Profile | null> {
  const res = await fetch(`${API_URL}/api/developers/${encodeURIComponent(username)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Profile request failed (${res.status})`);
  return res.json();
}

// Skills are a nice-to-have panel: any failure just hides it.
async function getSkills(username: string): Promise<Skills | null> {
  try {
    const res = await fetch(`${API_URL}/api/developers/${encodeURIComponent(username)}/skills`, {
      next: { revalidate: 60 },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const title = `${profile.name} (@${profile.username})`;
  const description = `${profile.name}'s kodwai profile: AI-agent coding challenges solved, scores and badges.`;

  return {
    title,
    description,
    // Profile indexing is deferred and will be opt-in per developer.
    robots: { index: false, follow: true },
    openGraph: { title: `${title} · kodwai`, description, type: "profile", siteName: "kodwai" },
    twitter: { card: "summary", title: `${title} · kodwai`, description },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, skills] = await Promise.all([getProfile(username), getSkills(username)]);
  if (!profile) notFound();

  const avatarNum = (profile.username.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 8) + 1;

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
              <h1 className="font-display text-xl">{profile.name}</h1>
              <p className="font-mono text-sm text-muted">@{profile.username}</p>
              {profile.tier && (
                <div className="mt-1">
                  <TierBadge tier={profile.tier} />
                </div>
              )}
              {profile.bio && <p className="font-mono text-xs text-muted mt-1">{profile.bio}</p>}
            </div>
          </div>

          {profile.level && (
            <div className="mb-4 pb-4 border-b border-border">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-mono text-[10px] text-muted uppercase tracking-wide">
                  Level <span className="font-display text-base text-ink">{profile.level.level}</span>
                </p>
                <p className="font-mono text-[10px] text-muted">
                  {profile.level.xp} XP · next {profile.level.next_level_xp}
                </p>
              </div>
              <div className="h-1.5 bg-cream-dark/30 border border-border overflow-hidden">
                <div
                  className="h-full bg-rust"
                  style={{ width: `${Math.min(100, Math.max(0, profile.level.progress * 100))}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="font-display text-2xl">{profile.direction_rating ?? 1000}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Direction</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl">{profile.efficiency_rating ?? 1000}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Efficiency</p>
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
              <p className="font-display text-2xl">{profile.preferred_agent || "—"}</p>
              <p className="font-mono text-[10px] text-muted uppercase tracking-wide">Agent</p>
            </div>
          </div>

          {(profile.github_url || profile.linkedin_url || profile.website_url || profile.x_url) && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border">
              {profile.github_url && <SocialLink kind="github" href={profile.github_url} />}
              {profile.x_url && <SocialLink kind="x" href={profile.x_url} />}
              {profile.linkedin_url && <SocialLink kind="linkedin" href={profile.linkedin_url} />}
              {profile.website_url && <SocialLink kind="website" href={profile.website_url} />}
            </div>
          )}
        </Card>

        {/* Mastery */}
        {skills && skills.category.length > 0 && (
          <Card className="mb-6">
            <p className="font-mono text-[10px] text-muted uppercase tracking-wide mb-3">Mastery · by category</p>
            <div className="flex justify-center">
              <MasteryRadar categories={skills.category} />
            </div>
          </Card>
        )}

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl mb-4">Badges</h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((b) => {
                const img = badgeImage(b.slug);
                return (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 border border-rust/20 bg-rust/5">
                    {img ? (
                      <img src={img} alt={b.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-xl">🏅</span>
                    )}
                    <div>
                      <p className="font-display text-sm">{b.name}</p>
                      {/* Fixed locale and zone: rendered on the server, so it must not depend on the viewer. */}
                      <p className="font-mono text-[10px] text-muted">
                        {formatDateCustom(b.earned_at, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {profile.recent_submissions?.length > 0 && (
          <>
            <h2 className="font-display text-xl mb-4">Recent Submissions</h2>
            <div className="space-y-3">
              {profile.recent_submissions.map((s) => (
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
