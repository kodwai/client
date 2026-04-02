import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "kodwai — AI-Agent Coding Platform",
    short_name: "kodwai",
    description:
      "Prove your AI-agent coding skills. Challenges, leaderboards, badges. Plus AI-native interviews for companies.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
