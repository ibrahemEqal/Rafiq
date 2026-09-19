# Performance passes — 2026-09-15 to 2026-09-19

Baseline: commit `06d78d2cb4ada63216d54140a79bca8bd8570ea4`.
The second pass is based on the tested signup branch at commit
`13995a75f8586728cb7a06da6ecfc14e67941a6b`. It adds no dependency,
service-role key or permission change.

## Maximum-rendering pass — 2026-09-19

- Public routes no longer refresh Supabase Auth in Proxy. Protected routes still
  refresh before rendering, and every mutation verifies its own signed identity.
- The account menu loads after the page from a private, no-store endpoint. It no
  longer holds the public HTML/RSC stream open, and the small client component
  persists across navigation because it lives in the shared layout.
- Arabic and English home pages are fully prerendered. The books route and public
  resource details opt into static/on-demand rendering where Next.js permits it.
- Public resources, books, questions and answers use a cookie-free anonymous
  client with a 60-second stale-while-revalidate cache. Visible mutations
  invalidate table-specific tags immediately. User, role and signed-link data
  never enter this shared cache.
- Verified identity now uses signed Auth claims. With asymmetric Supabase signing
  keys, verification is local after the JWKS cache is warm; RLS remains the final
  authorization boundary.
- Large blur filters and the sticky header backdrop filter were replaced with
  cheaper gradients/solid paint. Below-fold home features and the footer use
  `content-visibility: auto` with intrinsic fallback sizes.
- Migration `20260919190000_public_read_indexes.sql` adds four indexes matching
  the public feed pagination order for resources, questions and answers.

Controlled warm results with the same 80 ms Supabase fixture:

| Metric | Before this pass | After this pass |
| --- | ---: | ---: |
| Home first byte / main heading | 99.2 ms | 3.8 ms |
| Home complete response | 265.4 ms | 3.9 ms |
| Home Supabase requests | 3 | 0 |
| Home HTML, uncompressed | 39,854 bytes | 33,406 bytes |
| Home gzip estimate | 7,820 bytes | 6,309 bytes |
| Protected upload complete response | 264.5 ms | 180.8 ms |
| Protected upload Supabase requests | 3 | 2 |

This controlled result isolates server rendering and upstream waits. It is not a
claim that every real device or production request will reproduce the exact
milliseconds.

## Changes

- The navigation/logo/language switch render independently of the account menu.
  Only the account slot waits for verified claims and its current database role.
  Its Suspense fallback is neutral: it does not claim a user is signed out.
  The account dropdown uses native `details` rather than a hover-only menu.
- Resource, book and profile routes now have loading boundaries for progressive
  rendering and partial navigation prefetching.
- The root locale provider passes no message dictionary. Server-rendered labels
  remain on the server; upload/book/admin interactive sections each receive only
  their own namespace, once per section, not once per card. Sign-out receives a
  translated label. This follows the
  [next-intl selective-message guidance](https://next-intl.dev/docs/environments/server-client-components).
- Only publicly readable college/course IDs and Arabic names use the Next.js
  fetch cache, with a 3,600-second revalidation interval and `public-catalog` tag.
  Their independent queries execute in parallel on a cold cache. This client
  uses the public anon key with session persistence/refresh disabled and has no
  access to request cookies. Empty/error handling does not hide database errors.
- Resource details request only their seven displayed scalar columns plus name
  relations; no `SELECT *`, storage path, description or generated search vector.
  To-one relations support both object and array shapes; course/date display
  follows the current locale.
- CI runs all helper/security tests and a production build plus controlled SSR
  regression checks, including cross-user cache isolation.

These use [Next.js streaming](https://nextjs.org/docs/app/guides/streaming) and
[explicit fetch caching](https://nextjs.org/docs/app/api-reference/functions/fetch),
without enabling experimental settings or changing the app's caching mode.

## Controlled before/after comparison

Production builds, local HTTP, authenticated admin fixture, fixed 80 ms delay per
mock Supabase request. One warm-up visit then five measured visits per route;
numbers below are medians. Compression was disabled to observe streaming.
The response markers were the home `<h1` and upload `name="course_id"` HTML, not
a browser paint. The resource fixture includes an escaped script-like title.

| Metric | Baseline | Optimized |
| --- | ---: | ---: |
| Home first response byte / main heading HTML | 269.9 ms | 98.6 ms |
| Home entire response complete | 270.3 ms | 266.0 ms |
| Upload first response byte | 344.5 ms | 96.6 ms |
| Upload course field HTML available | 344.6 ms | 180.9 ms |
| Upload entire response complete | 344.7 ms | 263.8 ms |
| Upload upstream requests per warm visit | 5 | 3 |
| College/course dropdown requests over five warm visits | 10 | 0 |
| Home HTML response, uncompressed | 44,371 bytes | 39,854 bytes |
| Home HTML gzip estimate | 9,633 bytes | 7,824 bytes |
| Upload HTML response, uncompressed | 32,556 bytes | 31,685 bytes |
| Upload HTML gzip estimate | 7,937 bytes | 7,220 bytes |

Gzip values are Node gzip estimates of the complete HTML, not measured CDN wire
transfer sizes. The home still waits for the account slot before the **entire**
response finishes: streaming improves how soon its real content arrives, not
the underlying Auth latency. This is not a claim that the whole site is 3x faster.

68 native Node helper/security tests passed, TypeScript passed, and lint passed.
The SSR harness passed Arabic and
English pages/forms, escaped titles, lean detail queries, warm anonymous catalog
reads, anonymous upload denial, student/admin dashboard isolation and separate
student upload session props. These are mocks, not live database RLS tests.

## Reproduce safely

Use disposable local clones, not a running deployment. The harness rebuilds
`.next` with mock public settings, binds loopback ports 4100/54329, and shuts down
its mock servers. It does not contact a real Supabase project or alter source.
Rebuild normally afterward if you want to run that checkout against real data.

```sh
node --experimental-strip-types --test tests/*.test.mjs
npm run typecheck
npm run lint
node scripts/performance-smoke.mjs .
```

For comparison, run the current harness with a separate checkout of the baseline:

```sh
node scripts/performance-smoke.mjs /absolute/path/to/baseline --baseline
```

Node 22.6+ is needed for the native TypeScript test command. The SSR harness builds
production automatically; it is deliberately not a `next dev` benchmark.

## Deployment and limits

After pulling the branch, stop the dev server, inspect the migration dry run,
apply the single performance-index migration, then build in production mode:

```sh
npx supabase db push --dry-run
npx supabase db push
npm run build
npm run start
```

Auth, roles, moderation status, availability, resources, profile uploads and
signed URLs remain outside the **shared** catalog cache. Server actions still
verify the current user/role and the database still enforces RLS/triggers. A
catalog rename/addition can remain stale until time-based revalidation finishes;
future catalog-edit actions should invalidate the `public-catalog` tag.

Actual production TTFB, FCP/LCP/INP/CLS, JavaScript execution, database query plans,
network distance, user concurrency and CDN buffering have not been measured by
this HTTP mock harness. Check real admin/student uploads and moderation after
pulling, then use browser performance traces against `next start` or the deployed
site. Never globally cache a cookie-backed client to chase lower latency.
