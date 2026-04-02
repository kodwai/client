import type { Metadata } from "next";
import { Instrument_Serif, Space_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-logo",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "kodwai — AI-Agent Coding Platform",
  description:
    "Prove your AI-agent coding skills. Solve challenges with Claude Code or Cursor, get scored, compete on leaderboards. Plus: AI-native technical interviews for companies.",
  keywords: [
    "AI coding challenges",
    "Claude Code",
    "Cursor",
    "AI coding agent",
    "developer leaderboard",
    "AI interview",
    "technical interview",
    "coding platform",
    "AI-agent skills",
    "engineering hiring",
  ],
  icons: {
    icon: [{ url: "/icon", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "kodwai — AI-Agent Coding Platform",
    description:
      "Solve AI-agent coding challenges. Get scored on how you use Claude Code and Cursor. Compete on leaderboards. Earn badges. Plus: AI-native interviews for companies.",
    type: "website",
    siteName: "kodwai",
  },
  twitter: {
    card: "summary_large_image",
    title: "kodwai — AI-Agent Coding Platform",
    description:
      "Prove your AI-agent coding skills. Challenges, leaderboards, badges. The platform where developers compete on how well they wield AI.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${spaceMono.variable} ${playfairDisplay.variable}`}>
      <body className="bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
