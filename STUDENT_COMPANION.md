# Rafeeq: the student companion

This release adds a personal home for university life (`/companion`) and student-hosted gatherings (`/circles`) in Arabic and English. It also refreshes the landing page, navigation and typography. Existing resources, book exchange, Q&A, requests and manual study sets remain available.

## What students can do

- Plan tasks, exams and personal steps; edit them, record completion, and keep future tasks and completed history.
- Save a weekly class timetable. The editor detects overlaps, while “I have a gap” uses the saved timetable and Palestine time.
- Choose a daily focus intention and run a 10/25/50 minute focus session. The timer survives reloads in the same tab; students explicitly record finished sessions. Pause, resume and reset are available.
- Make a downloadable/shareable daily card containing only a name, date, completed-step count and focus minutes. Task text, grades, spending and letters never appear on this card.
- Simulate a credit-weighted semester average and cumulative average on a 4 or 100 point scale, with live course sliders and target arithmetic. This is a manual scenario tool, not an official university grade conversion or record.
- Track expenses in shekels, a monthly spending limit, remaining balance and per-day arithmetic. Older months remain accessible. No bank account, payment or AI service is involved.
- Write private letters to a future self. Their reading interface opens on the chosen date; this is an interface date gate, not timed encryption or an email delivery promise.
- Host a study gathering, skill exchange or social break for 2–12 people, including the host. Students can join, leave, close a hosted gathering, copy an invitation link, and privately report a gathering. Admins can review reported open gatherings at the top of the square, dismiss reports or close a gathering.

## Activation

Deploy the application and apply these migrations to the same Supabase project, in order, after the existing repository migrations:

1. `supabase/migrations/20261024010000_student_companion.sql`
2. `supabase/migrations/20261024020000_campus_circles.sql`

For a linked Supabase project, inspect pending migrations first with `supabase migration list`, then apply the reviewed pending migrations using `supabase db push`. Alternatively, run the two new SQL files in order in the Supabase SQL editor. Do not rerun migrations that have already been applied.

These migrations add tables/functions/policies and depend on the existing `profiles`, `is_admin` and Auth schema. They do not delete or rewrite existing resources, books, users or study sets. No new environment variables or paid external services are required. The regular Supabase and site URL environment variables still apply.

Until the companion migration is available, the personal tools explicitly say they are saved in this browser. The square displays its activation state instead of fabricated events. Other database errors display a retry screen; they do not silently replace account data with an empty plan. Account-specific browser data saved before activation can be explicitly imported into empty cloud sections later.

## Data and permissions

Guest data uses a browser-local guest plan. A signed-in browser plan is keyed by verified account ID. Cloud data is private per account, including spending, grade simulations and letters. Each section has its own version. A stale device receives a conflict and fetches current cloud data rather than replaying a destructive overwrite. The browser import button copies only into empty account sections and preserves original browser data. On a shared device, guest plans remain accessible to anyone using that browser; the interface labels browser-only storage.

Database ownership is derived from `auth.uid()`. Direct table writes are revoked. Circle joins lock their circle row before checking capacity. First personal saves, hosting limits and report limits serialize on the authenticated user's row. Hosting is capped at 5 creations per 24 hours; reporting across at most 10 distinct gatherings per 24 hours. The host occupies one seat and cannot leave their own gathering; they can close it. Anonymous visitors can read upcoming open gatherings but cannot mutate them. Public circle payloads omit Auth IDs, membership rosters and report contents. Reports are visible to their reporter and admins only.

## Validation

- `node --experimental-strip-types --test tests/*.test.mjs`
- `npm run typecheck`
- `npm run lint`
- `node scripts/performance-smoke.mjs .`: builds production and exercises Arabic/English SSR plus real compiled Server Actions against a controlled local backend. It is not a test of the production Supabase deployment.
- `supabase test db`: includes `supabase/tests/database/companion_circles.test.sql` for private reads, ownership, stale versions, seat limits, idempotent joins, reports and admin closure. Run against a local Supabase instance with all migrations applied.

The IBM Plex Sans Arabic font is self-hosted; its license is included in `public/fonts/OFL.txt`.
