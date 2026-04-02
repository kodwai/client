# kodwai — Client

The web application for [kodwai](https://kodwai.com), the AI-agent coding platform.

## Overview

This is a Next.js 16 application with three route groups:

- **(developer)** — Developer platform: challenges, submissions, leaderboard, badges, profile
- **(dashboard)** — Company platform: interview projects, sessions, scoring, team management
- **(admin)** — Admin panel: users, organizations, challenges, analytics, system health

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**

## Design System

- Background: `#faf8f4` (warm cream)
- Accent: `#c23616` (rust/terracotta)
- Display font: Instrument Serif
- Mono font: Space Mono
- Logo font: Playfair Display

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Routes

### Developer (`/dev/*`)
- `/dev/challenges` — Browse coding challenges
- `/dev/challenges/[slug]` — Challenge detail + start
- `/dev/submissions` — Your submission history
- `/dev/submissions/[id]` — Submission detail + score breakdown
- `/dev/leaderboard` — Global rankings
- `/dev/badges` — Achievement badges
- `/dev/profile` — Your profile
- `/dev/settings` — API key management

### Company (`/dashboard`, `/projects/*`, `/sessions/*`, `/settings/*`)
- `/dashboard` — Interview overview
- `/projects` — Interview project management
- `/sessions` — Session monitoring + scoring

### Admin (`/admin/*`)
- `/admin/dashboard` — Platform stats
- `/admin/users` — User management (verify, ban, roles)
- `/admin/challenges` — Challenge CRUD
- `/admin/submissions` — All submissions + re-score
- `/admin/analytics` — Signups, submissions, agent usage charts
- `/admin/system` — Health check + audit log
