import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/site";

// Crawling stays open on purpose: private routes (admin, auth, dashboard, /dev/*)
// carry a noindex robots meta tag from their layouts, and a Disallow here would
// stop crawlers from ever seeing it. Only the PostHog proxy is blocked.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/ingest/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
