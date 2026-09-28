# An-Najah academic catalog

Rafiq's resource library follows this hierarchy:

`university requirements -> requirement -> course code -> approved resources`

or `college -> major -> course -> approved resources`.

## Shared courses and fast selectors (2026-09-28)

The nine university-wide groups live in the dedicated configuration file
`lib/catalog/university-requirements.ts`. They are displayed once in their own
library section and excluded from An-Najah's major-specific dropdowns.
English 101 is the official `11000103` (English Language I). English 102 has
multiple official plan codes (`11000322`–`11000330`): the UI groups them together,
but the student still chooses the exact code. Similar names are NOT evidence
that two codes have the same syllabus. Specialized medical/AI variants remain
in their original majors unless deliberately added to the configuration.

Questions, requests, editing and uploads share a lazy course selector. It starts
with the small college list; majors and courses load only after choosing a
parent. Empty selection still means general/no course for posts and filters;
uploads require a course. Requests are cancelled when a parent changes, stale
selections are cleared, and a failed request can be retried without losing form
text. `/api/catalog` requires exactly one valid parent and never returns the
entire course table.

Apply **only the new additive migration** before deploying this code:

```bash
npx supabase db push --dry-run
# Expect: 20260928210000_shared_course_catalog.sql
npx supabase db push
```

This adds an index and two `security_invoker` read views. It does not delete,
move, update, or reseed existing course/resource rows. Same university + same
code produces one option, while all existing course IDs continue to work.
Approved resources and course filters include the IDs from all majors sharing
that code; a different university or code remains isolated. Upload moderation
and existing RLS policies are unchanged.

Do **not** regenerate/reapply the original seed or mark its remote migration as
reverted. Keep your existing local generated seed file. If the dry run lists
unexpected migrations or reports a history mismatch, stop and resolve that
history before pushing. Never put database passwords/service-role keys in
client code or Vercel public variables.

Verification (Node 24+ for TypeScript test imports):

```bash
npm run typecheck
npm run lint
node --test tests/*.test.mjs
node scripts/performance-smoke.mjs
```

Optional isolated integration tests require externally installed test tools,
not production dependencies:

```bash
# With @electric-sql/pglite installed in the test environment:
node scripts/catalog-db-smoke.mjs
# With Playwright and Chromium installed in the test environment:
RAFIQ_BROWSER_TESTS=1 node scripts/performance-smoke.mjs
```

`PGLITE_MODULE` and `PLAYWRIGHT_MODULE` can point to external module paths.
The SQL test uses a disposable in-memory PostgreSQL database. The production
SSR/browser tests use a local mock backend; **none contacts or modifies live
Supabase**. Their timings are not measurements of live Vercel/Core Web Vitals.

## Original import

The catalog generator reads the current undergraduate-program list and the
latest Arabic and English study plans published by An-Najah National
University. It produces an idempotent Supabase migration; re-running the
generator updates names and adds new programs/courses without duplicating
existing rows.

The importer deliberately sends one request at a time and honors the server's
`Retry-After` response. Every successful page is cached under
`.cache/najah-catalog`, so an interrupted or rate-limited run can be started
again with the same command and resumes without downloading completed pages.

```bash
npm run catalog:build
npx supabase db push --dry-run
npx supabase db push
```

To intentionally discard the download cache and fetch a fresh copy of every
official page, run `npm run catalog:build -- --refresh`.

Generated migration:

`supabase/migrations/20260926020000_seed_najah_catalog.sql`

Before applying it, confirm the generator summary. At the time this feature was
built, the official catalog returned 13 colleges, 143 programs, and 12,697
program-course records. A course shared by multiple programs is intentionally
stored once under each program because the existing database model makes a
course belong to one major.

Source:

https://www.najah.edu/ar/academic/undergraduate-programs/by-faculty/
