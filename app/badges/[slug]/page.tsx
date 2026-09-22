import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { badgeImage } from "@/lib/badges";
import { API_URL } from "@/lib/site";

interface BadgeDef {
  slug: string;
  name: string;
  description: string;
}

// Share-card flavor text for the social preview. Badges without an entry fall
// back to their API description.
const OG_DESCRIPTIONS: Record<string, string> = {
  "first-blood": "Drew first blood: completed their first AI-agent coding challenge on kodwai.",
  "five-down": "5 AI-agent coding challenges completed. Building the new essential skill.",
  "ten-strong": "10 challenges deep. This developer knows how to wield AI coding agents.",
  "quarter-century": "25 challenges completed. A true AI-agent coding veteran.",
  "streak-3": "3-day coding streak. Consistency is the new talent.",
  "streak-7": "7-day streak. A full week of AI-agent coding challenges.",
  "streak-30": "30-day streak. A month of daily AI-agent coding practice. Built different.",
  "top-10": "Top 10% on an AI-agent coding challenge. Elite performance.",
  "speed-demon": "Finished in under half the time limit. Speed meets AI mastery.",
  "perfect-score": "Near-perfect score on an AI-agent challenge. The bar is set.",
  "polyglot": "Conquered challenges across 3+ categories. Full-stack AI wielder.",
  "claude-master": "Mastered Claude Code across 5+ challenges. The AI whisperer.",
  "cursor-pro": "Mastered Cursor across 5+ challenges. Ship at lightspeed.",
  "codex-pro": "Mastered Codex across 5+ challenges. Terminal-native and unstoppable.",
  "early-adopter": "Joined kodwai early, before everyone else figured out AI-agent coding matters.",
};

// Returns null only when the badge does not exist. Any other failure throws, so
// an API outage renders the error page instead of a false "not found".
async function getBadge(slug: string): Promise<BadgeDef | null> {
  const res = await fetch(`${API_URL}/api/badges`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Badge list request failed (${res.status})`);
  const badges: BadgeDef[] = await res.json();
  return badges.find((b) => b.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const badge = await getBadge(slug);
  if (!badge) notFound();

  const title = `${badge.name} badge`;
  const socialTitle = `${badge.name} · kodwai badge`;
  const description = OG_DESCRIPTIONS[slug] || badge.description;
  const imageUrl = badgeImage(slug);

  return {
    title,
    description,
    openGraph: {
      title: socialTitle,
      description,
      type: "website",
      siteName: "kodwai",
      images: imageUrl ? [{ url: imageUrl, width: 512, height: 512, alt: socialTitle }] : undefined,
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function BadgeSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const badge = await getBadge(slug);
  if (!badge) notFound();

  const imageUrl = badgeImage(slug);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="border border-rust bg-gradient-to-b from-rust/8 to-transparent p-12 mb-6">
          <div className="mb-4 flex justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={badge.name} className="w-24 h-24 object-contain" />
            ) : (
              <span className="text-6xl">🏅</span>
            )}
          </div>
          <h1 className="font-display text-3xl mb-2">{badge.name}</h1>
          <p className="font-mono text-sm text-muted mb-4">{badge.description}</p>
          <div className="h-px bg-rust/20 my-4" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            kodwai · ai-agent coding platform
          </p>
        </div>
        <Link
          href="/dev/challenges"
          className="inline-block px-6 py-3 bg-rust text-white font-mono text-sm uppercase tracking-widest hover:bg-rust/90 transition-colors"
        >
          Start Earning Badges
        </Link>
      </div>
    </div>
  );
}
