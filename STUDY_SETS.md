# Study sets and manual flashcards

This MVP adds `/study` (Arabic) and `/en/study` (English). It has no AI calls,
PDF parsing, API keys, paid services, or new package dependencies.

## What students can do

- Create, edit and delete private study sets with a title, optional course name
  and optional notes.
- Add, edit and delete question/answer flashcards.
- Collect external HTTPS links or local `/resources/<uuid>` resource links.
  The source files are not copied or fetched. Their original access rules apply.
- Review all cards, new/due cards, or cards last rated forgotten.
- Reveal an answer before rating recall. A failed save keeps the current card
  on screen. Session results are self-reported recall, not an exam prediction.
- Signed-in students save their own progress across devices. Forgotten cards
  are due in ten minutes. Consecutive remembered ratings schedule the next
  review after 1, 3, 7, 14 and 30 days (a simple fixed schedule).
- Guest readers can review shared sets during the current session. Their
  ratings are not sent to the server or persisted.

Limits are enforced in PostgreSQL: 100 sets per owner, 300 cards and 100 source
links per set. Limits apply to direct REST writes too, including card moves.
The dashboard lists 20 sets per page and fetches one extra to detect pagination.

## Sharing and privacy

Sets are private by default. Sharing is deliberately read-only: the owner keeps
editing rights; readers may save only their own review progress.

A shared link is `/study/shared/<random-uuid>` (with `/en` for English). Merely
knowing the internal set or card ID grants no access. Shared content is read
through `get_shared_study_set(token)`; direct set/card/source table reads remain
owner-only, so clients cannot enumerate shared tokens. The shared payload omits
owner identity and does not include sharing tokens. Pages use request-scoped
cookie clients without a public data cache, and the entire study subtree has
`noindex` metadata.

Switching a shared set to private rotates the capability token. The previous
link stops returning content, and cannot be used to save more reviews.
Re-enabling sharing uses the replacement token. Already viewed content cannot
be recalled from a reader's memory or device.

`review_study_card` derives the reviewer from `auth.uid()` and checks ownership
or the active capability every time. Parent/card locks serialize source access
against revocation/deletion. Review rows are readable only by their reviewer;
even the set owner cannot read other students' recall history. Direct review
INSERT/UPDATE is not granted. Deleting a set/card cascades its review records.

## Deployment

Run the complete additive migration in the intended Supabase project's SQL
Editor, or apply it through the existing linked CLI migration workflow:

`supabase/migrations/20261023030000_study_sets_and_flashcards.sql`

No extra environment variables are needed. Before that migration is applied,
the signed-in dashboard shows an activation message and does not offer a
nonfunctional create form. Existing features remain available.

After deployment, verify with two separate accounts and a signed-out browser:

1. Create a private set and a card. The second account and guest cannot open
   its owner URL.
2. Enable sharing and copy the generated link. Both readers can study the
   cards; neither can edit them.
3. Rate a card in the second account. The first account must not see that
   progress. Reload the review page to confirm the second account's progress.
4. Disable sharing and reload the guest page. The old link must be unavailable,
   including after sharing is turned back on.
5. Edit/delete a card and a source link, then delete the set.

## Validation

- `node --experimental-strip-types --test tests/*.test.mjs`
- `npm run typecheck`
- `npm run lint`
- `node scripts/performance-smoke.mjs .` builds production and exercises compiled
  Server Actions and Arabic/English pages against a controlled local mock.
- `supabase test db` against a local Supabase test project runs
  `supabase/tests/database/study_privacy.test.sql` (48 assertions).

During implementation, those 48 assertions were also executed with actual
PostgreSQL RLS, trigger and constraint behavior through PGlite, including
Supabase-style permissive default grants. Only pgTAP's assertion wrappers were
replaced for that local run. No production database or real user records were
contacted.
