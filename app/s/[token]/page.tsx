import type { Metadata } from "next";
import Link from "next/link";
import { ScoreCardServer } from "./score-card-server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ShareData {
  challenge_title: string;
  challenge_slug: string;
  challenge_difficulty: string;
  challenge_category: string;
  score: number;
  objective_score: number | null;
  analytical_score: number | null;
  strengths: string[];
  agent_used: string;
  time_minutes: number | null;
  time_limit_minutes: number;
  username: string | null;
  user_name: string | null;
  rank: number | null;
}

async function getShareData(token: string): Promise<ShareData | null> {
  try {
    const res = await fetch(`${API_URL}/api/share/${token}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getShareData(token);

  if (!data) {
    return { title: "kodwai — Score Card" };
  }

  const title = `${data.score.toFixed(0)}/100 on "${data.challenge_title}" — kodwai`;
  const description = `${data.user_name || data.username || "A developer"} scored ${data.score.toFixed(0)}/100 on "${data.challenge_title}" using ${data.agent_used}. Solve AI-agent coding challenges on kodwai.`;
  const ogImageUrl = `${API_URL}/api/share/${token}/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://app.kodwai.com/s/${token}`,
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
      title,
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

  if (!data) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-2">Score card not found</h1>
          <p className="font-mono text-sm text-muted mb-6">
            This share link may have expired or doesn't exist.
          </p>
          <Link
            href="https://kodwai.com"
            className="font-mono text-sm text-rust hover:text-rust-hover transition-colors"
          >
            Visit kodwai.com
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="https://kodwai.com">
            <span className="font-display text-2xl tracking-wide">kodwai</span>
          </Link>
        </div>

        {/* Score Card */}
        <ScoreCardServer data={data} token={token} />

        {/* CTA */}
        <div className="text-center mt-10 pt-8 border-t border-border">
          <h2 className="font-display text-xl mb-2">
            Think you can beat this score?
          </h2>
          <p className="font-mono text-sm text-muted mb-6">
            Solve coding challenges with AI agents. Get scored. Climb the
            leaderboard.
          </p>
          <a
            href="https://kodwai.com"
            className="inline-block px-6 py-3 bg-rust text-cream font-mono text-sm hover:bg-rust-hover transition-colors"
          >
            Join kodwai
          </a>
        </div>
      </div>
    </div>
  );
}
