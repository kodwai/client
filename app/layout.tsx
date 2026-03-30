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
  title: "kodwai — AI Interview Platform",
  description:
    "Technical interviews powered by Claude Code. Full session capture. AI-powered scoring. See how engineers actually work with AI.",
  keywords: [
    "AI interview",
    "technical interview",
    "Claude Code",
    "AI coding agent",
    "interview platform",
    "engineering hiring",
  ],
  icons: {
    icon: [{ url: "/icon", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "kodwai — AI Interview Platform",
    description:
      "Technical interviews powered by Claude Code. Full session capture. AI-powered scoring.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "kodwai — AI Interview Platform",
    description:
      "Technical interviews powered by Claude Code. Full session capture. AI-powered scoring.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${spaceMono.variable} ${playfairDisplay.variable}`}>
      <body className="bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
