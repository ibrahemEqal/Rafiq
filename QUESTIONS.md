# Questions and answers — first release

Uses the existing `questions`, `answers`, `profiles` and `courses` tables and
existing RLS. No schema migration or Supabase CLI command is required.

## Routes and features

- `/questions`: latest questions, title/body full-text search, optional course
  filter and previous/next pages. Arabic is the default; prefix `/en` for English.
- `/questions/new`: signed-in users create a question with an optional course.
- `/questions/[id]`: public question/answer reading and signed-in answer posting.
  Answers are newest-first; a new answer posted from an older page navigates back
  to page one. Invalid or missing IDs render a not-found view.
- Text is escaped plain text with preserved newlines, not executable HTML or
  rendered Markdown. Forms show inline errors and pending/success states.

Every write verifies `auth.getUser()` again through the request cookie-backed
client. `author_id` is derived from that verified user; caller-supplied authors,
roles, timestamps and record IDs are ignored. Selected courses/questions are
looked up before insert, while database foreign keys handle deletion races.
Database/network errors are returned generically, without raw SQL/error details.

Question titles are trimmed and limited to 5–160 characters, question bodies to
10–8000, answer bodies to 2–8000. PostgreSQL-compatible GUIDs are accepted.
Do not retry a submission blindly after an uncertain network failure: first
reload and check whether it was saved.

## Performance

Lists fetch 20 rows plus one look-ahead row, with stable creation-time/ID ordering.
There is no exact total count or per-card answer/profile request. Question and
course list reads start in parallel; question and answer detail reads do too.
Only public course names/IDs use the existing one-hour anon catalog cache. Posts,
Auth and author data are not placed in a shared cache. The course dropdown still
uses the project's configured Supabase API row limit, as the existing upload
catalog does; a large catalog will need separate dropdown pagination/search.

Question routes have loading/error boundaries. Auth-dependent answer composition
streams separately from the public post. Only the Questions namespace reaches
interactive forms; the root locale provider still passes no dictionary.
Search uses the existing weighted `search_vector` and GIN index with `simple`
web-search configuration; see [Supabase full-text search](https://supabase.com/docs/guides/database/full-text-search).

Native TypeScript helper tests require explicit `.ts` imports. The existing
`noEmit` TypeScript config now enables
[`allowImportingTsExtensions`](https://www.typescriptlang.org/tsconfig/allowImportingTsExtensions.html);
Next.js remains the runtime bundler, and no dependency was added.

## Verification and limits

56 native Node helper/security tests passed locally, along with TypeScript,
lint (two existing warnings), and a production build. The controlled SSR harness
also checks both locales, search/course filters, both page directions, escaped
question/answer bodies, missing IDs and anonymous form gating. It POSTs the actual
compiled Next.js actions using Flight encoding against a **mock** Supabase API,
checks verified ownership/anonymous denial, and reads the newly posted content
publicly. It does not execute a live PostgreSQL RLS policy or browser hydration.

```sh
node --experimental-strip-types --test tests/*.test.mjs
npm run typecheck
npm run lint
node scripts/performance-smoke.mjs .
```

Use a disposable clone for the SSR harness: it rebuilds `.next` with mock settings,
as documented in PERFORMANCE.md. CI includes this harness. Its action checks
inspect the generated action manifest and use the compiled Flight encoder for
the pinned Next.js version; update those checks if Next.js changes the protocol.

Before merging, test real sessions: a signed-out visitor can read but not publish;
a student can publish a general/course question and another account can answer;
both authors are correct in the database; refresh preserves posts and Arabic/
English links stay localized. Then retest existing uploads and admin approval.

This is a basic forum, not a complete moderation system. There is no answer
acceptance/voting, edit/delete UI, reports, durable rate limiting or database text
CHECK constraints added here. The button's pending state is UX, not spam defense.
Existing owner/admin update/delete RLS remains unchanged. Add abuse controls and
moderation before opening unrestricted public registration at scale.
