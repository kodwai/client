import type { Metadata } from "next";
import { Instrument_Serif, Space_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-M4NC2LHZ5V";

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
  title: "kodwai — AI-Agent Coding Challenges",
  description:
    "Prove your AI-agent coding skills. Solve challenges on your own machine with Claude Code, Cursor, Codex, or any AI agent. Get scored, compete on leaderboards, build your profile.",
  keywords: [
    "AI coding challenges",
    "Claude Code",
    "Cursor",
    "Codex",
    "AI coding agent",
    "developer leaderboard",
    "coding platform",
    "AI-agent skills",
    "developer challenges",
  ],
  icons: {
    icon: [{ url: "/icon", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "kodwai — AI-Agent Coding Challenges",
    description:
      "Solve AI-agent coding challenges on your own machine with Claude Code, Cursor, Codex, and more. Compete on leaderboards. Earn badges.",
    type: "website",
    siteName: "kodwai",
  },
  twitter: {
    card: "summary_large_image",
    title: "kodwai — AI-Agent Coding Challenges",
    description:
      "Prove your AI-agent coding skills. Challenges, leaderboards, badges. The platform where developers compete on how well they wield AI.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${spaceMono.variable} ${playfairDisplay.variable}`}>
      <body className="bg-cream text-ink antialiased">{children}</body>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </html>
  );
}
