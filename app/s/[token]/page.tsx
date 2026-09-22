import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScoreCardServer } from "./score-card-server";
import { API_URL, APP_URL, LANDING_URL } from "@/lib/site";

interface ShareData {
  challenge_title: string;
  challenge_slug: string;
  // Not sent by the API yet; when it is, drafts and retired challenges skip the CTA.
  challenge_is_public?: boolean;
  challenge_difficulty: string;
  challenge_category: string;
  score: number;
  objective_score: number | null;
  analytical_score: number | null;
  strengths: string[];
  agent_used: string;
  model_display: string | null;
  time_minutes: number | null;
  time_limit_minutes: number;
  username: string | null;
  user_name: string | null;
  rank: number | null;
}

// Returns null only when the share token does not exist (API 404). Any other
// failure throws, so an API outage renders the error page instead of a soft 404.
async function getShareData(token: string): Promise<ShareData | null> {
  const res = await fetch(`${API_URL}/api/share/${encodeURIComponent(token)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Share card request failed (${res.status})`);
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getShareData(token);
  if (!data) notFound();

  const title = `${data.score.toFixed(0)}/100 on "${data.challenge_title}"`;
  const socialTitle = `${title} · kodwai`;
  const description = `${data.user_name || data.username || "A developer"} scored ${data.score.toFixed(0)}/100 on "${data.challenge_title}" using ${data.agent_used}. Solve AI-agent coding challenges on kodwai.`;
  const ogImageUrl = `${API_URL}/api/share/${token}/og`;

  return {
    title,
    description,
    // Share cards are personal results meant for social previews, not search.
    robots: { index: false, follow: true },
    openGraph: {
      title: socialTitle,
      description,
      type: "website",
      url: `${APP_URL}/s/${token}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Score card: ${data.score.toFixed(0)}/100 on ${data.challenge_title}`,
        },
      ],
      siteName: "kodwai",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getShareData(token);
  if (!data) notFound();

  const challengeUrl =
    data.challenge_slug && data.challenge_is_public !== false
      ? `${LANDING_URL}/challenges/${encodeURIComponent(data.challenge_slug)}`
      : null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <a href={LANDING_URL}>
            <span className="font-display text-2xl tracking-wide">kodwai</span>
          </a>
        </div>

        {/* Score Card */}
        <ScoreCardServer data={data} token={token} />

        {/* CTA */}
        <div className="text-center mt-10 pt-8 border-t border-border">
          <h2 className="font-display text-xl mb-2">
            Think you can beat this score?
          </h2>
          <p className="font-mono text-sm text-muted mb-6">
            {challengeUrl
              ? `Try "${data.challenge_title}" with your own AI agent. Get scored. Climb the leaderboard.`
              : "Solve coding challenges with AI agents. Get scored. Climb the leaderboard."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {challengeUrl && (
              <a
                href={challengeUrl}
                className="inline-block px-6 py-3 bg-rust text-cream font-mono text-sm hover:bg-rust-hover transition-colors"
              >
                Try this challenge
              </a>
            )}
            <a
              href={LANDING_URL}
              className={
                challengeUrl
                  ? "font-mono text-sm text-muted hover:text-rust transition-colors"
                  : "inline-block px-6 py-3 bg-rust text-cream font-mono text-sm hover:bg-rust-hover transition-colors"
              }
            >
              Join kodwai
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
