import type { Metadata } from "next";

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

const BADGE_DATA: Record<string, { name: string; description: string; icon: string }> = {
  "first-blood": { name: "First Blood", description: "Completed their first coding challenge", icon: "sword" },
  "five-down": { name: "Five Down", description: "Completed 5 coding challenges", icon: "star" },
  "ten-strong": { name: "Ten Strong", description: "Completed 10 coding challenges", icon: "trophy" },
  "quarter-century": { name: "Quarter Century", description: "Completed 25 coding challenges", icon: "crown" },
  "streak-3": { name: "On Fire", description: "Completed challenges 3 days in a row", icon: "flame" },
  "streak-7": { name: "Week Warrior", description: "Completed challenges 7 days in a row", icon: "flame-double" },
  "streak-30": { name: "Monthly Machine", description: "Completed challenges 30 days in a row", icon: "flame-triple" },
  "top-10": { name: "Top 10%", description: "Scored in the top 10% on a coding challenge", icon: "medal" },
  "speed-demon": { name: "Speed Demon", description: "Completed a challenge in under 50% of the time limit", icon: "lightning" },
  "perfect-score": { name: "Perfectionist", description: "Scored 95 or above on a coding challenge", icon: "diamond" },
  "polyglot": { name: "Polyglot", description: "Completed challenges in 3+ categories", icon: "globe" },
  "claude-master": { name: "Claude Master", description: "Scored 80+ on 5 challenges using Claude Code", icon: "brain" },
  "cursor-pro": { name: "Cursor Pro", description: "Scored 80+ on 5 challenges using Cursor", icon: "cursor" },
  "early-adopter": { name: "Early Adopter", description: "Joined kodwai in the first 30 days", icon: "clock" },
};

const OG_DESCRIPTIONS: Record<string, string> = {
  "first-blood": "Drew first blood — completed their first AI-agent coding challenge on kodwai",
  "five-down": "5 AI-agent coding challenges completed. Building the new essential skill.",
  "ten-strong": "10 challenges deep. This developer knows how to wield AI coding agents.",
  "quarter-century": "25 challenges completed. A true AI-agent coding veteran.",
  "streak-3": "3-day coding streak. Consistency is the new talent.",
  "streak-7": "7-day streak — a full week of AI-agent coding challenges.",
  "streak-30": "30-day streak. A month of daily AI-agent coding practice. Built different.",
  "top-10": "Top 10% on an AI-agent coding challenge. Elite performance.",
  "speed-demon": "Finished in under half the time limit. Speed meets AI mastery.",
  "perfect-score": "Near-perfect score on an AI-agent challenge. The bar is set.",
  "polyglot": "Conquered challenges across 3+ categories. Full-stack AI wielder.",
  "claude-master": "Mastered Claude Code across 5+ challenges. The AI whisperer.",
  "cursor-pro": "Mastered Cursor across 5+ challenges. Ship at lightspeed.",
  "early-adopter": "Joined kodwai early — before everyone else figured out AI-agent coding matters.",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const badge = BADGE_DATA[slug];
  const title = badge ? `${badge.name} — kodwai Badge` : "kodwai Badge";
  const description = OG_DESCRIPTIONS[slug] || (badge ? badge.description : "A kodwai achievement badge");
  const imageUrl = BADGE_IMAGES[slug] ? `/badges/${slug}.png` : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "kodwai",
      images: imageUrl ? [{ url: imageUrl, width: 512, height: 512, alt: title }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function BadgeSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const badge = BADGE_DATA[slug];

  if (!badge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl mb-2">Badge not found</p>
          <a href="/dev/badges" className="font-mono text-sm text-rust">View all badges</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="border border-rust bg-gradient-to-b from-rust/8 to-transparent p-12 mb-6">
          <div className="mb-4 flex justify-center">
            {BADGE_IMAGES[slug] ? (
              <img src={BADGE_IMAGES[slug]} alt={badge.name} className="w-24 h-24 object-contain" />
            ) : (
              <span className="text-6xl">🏅</span>
            )}
          </div>
          <h1 className="font-display text-3xl mb-2">{badge.name}</h1>
          <p className="font-mono text-sm text-muted mb-4">{badge.description}</p>
          <div className="h-px bg-rust/20 my-4" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            kodwai — ai-agent coding platform
          </p>
        </div>
        <a
          href="/dev/challenges"
          className="inline-block px-6 py-3 bg-rust text-white font-mono text-sm uppercase tracking-widest hover:bg-rust/90 transition-colors"
        >
          Start Earning Badges
        </a>
      </div>
    </div>
  );
}
