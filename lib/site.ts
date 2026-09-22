// Canonical hosts. This app is app.kodwai.com; the marketing site, blog and the
// public challenge pages live on www.kodwai.com (the apex redirects to www).
export const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.kodwai.com";
export const LANDING_URL = "https://www.kodwai.com";

// Server-side API base. Same value the client bundle uses.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
