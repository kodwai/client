// Badge slugs that have artwork at /public/badges/<slug>.png. Badge names and
// descriptions come from the API (GET /api/badges); only the images live here.
const BADGES_WITH_ART = new Set([
  "first-blood",
  "five-down",
  "ten-strong",
  "quarter-century",
  "streak-3",
  "streak-7",
  "streak-30",
  "top-10",
  "speed-demon",
  "perfect-score",
  "polyglot",
  "claude-master",
  "cursor-pro",
  "codex-pro",
  "early-adopter",
]);

/** Public path of a badge's artwork, or null when it has none yet. */
export function badgeImage(slug: string): string | null {
  return BADGES_WITH_ART.has(slug) ? `/badges/${slug}.png` : null;
}
