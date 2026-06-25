<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the kodwai Next.js App Router project. PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), with a reverse proxy configured in `next.config.ts` to route events through `/ingest`. Eleven events are now captured across seven files covering the two core user journeys — developers solving challenges, and companies running interview sessions.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | Developer or company completes email/password registration | `app/(auth)/signup/page.tsx` |
| `signup_user_type_selected` | User selects their account type (developer or company) during signup | `app/(auth)/signup/page.tsx` |
| `user_logged_in` | User signs in with email and password | `app/(auth)/login/page.tsx` |
| `github_auth_completed` | User completes GitHub OAuth login or signup | `app/auth/github/callback/page.tsx` |
| `challenge_viewed` | Developer views a challenge detail page — top of the challenge conversion funnel | `app/(developer)/dev/challenges/[slug]/page.tsx` |
| `challenge_cli_command_copied` | Developer copies the CLI command to start a challenge — key intent signal | `app/(developer)/dev/challenges/[slug]/page.tsx` |
| `challenge_feedback_submitted` | Developer submits or updates feedback for a challenge | `components/feedback/challenge-feedback-form.tsx` |
| `api_key_added` | Developer saves an Anthropic API key to unlock AI-powered scoring | `app/(developer)/dev/settings/page.tsx` |
| `api_key_deleted` | Developer deletes a saved Anthropic API key | `app/(developer)/dev/settings/page.tsx` |
| `project_created` | Company user creates a new interview project with rubric and tool settings | `app/(dashboard)/projects/new/page.tsx` |
| `platform_feedback_submitted` | User submits a bug report, feature request, or general platform feedback | `components/feedback/platform-feedback-modal.tsx` |

User identification (`posthog.identify`) is called on email login, GitHub auth, and successful signup, associating events with user profiles. Error tracking (`posthog.captureException`) is also wired into all catch blocks in the edited files.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1642363)
- [New signups over time](/insights/TyYmQkbM) — daily email + GitHub registrations
- [Challenge engagement funnel](/insights/mHdHdlsX) — challenge viewed → CLI command copied
- [Developer onboarding funnel](/insights/8cpaLJ9u) — signup → view challenge → start challenge → submit feedback
- [Login method breakdown](/insights/GDoOJFAE) — email vs GitHub auth over time
- [API key adoption](/insights/hyF3pqUZ) — developers unlocking AI-powered scoring

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
