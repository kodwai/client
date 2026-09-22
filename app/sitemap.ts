import type { MetadataRoute } from "next";

// Only genuinely public, server-rendered, indexable pages belong here. The app is
// login-gated, and the marketing and public challenge pages live on
// www.kodwai.com with their own sitemap. Public developer profiles stay out until
// profile indexing ships as an opt-in.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
