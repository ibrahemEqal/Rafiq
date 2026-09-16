# Forum controls and moderation

This change uses the existing `questions`, `answers`, `reports` and `profiles`
tables. It adds one database migration:

`20260916200000_forum_moderation_controls.sql`

## Behavior

- Question owners and administrators can edit or permanently delete questions.
  Deleting a question also deletes its answers through the existing foreign key.
- Answer owners and administrators can edit or permanently delete answers.
- A signed-in user can report someone else's question or answer with a reason of
  10–1000 characters. A user cannot report their own post or submit a second
  pending report for the same target.
- Administrators review reports at `/dashboard/reports`. Review and dismissal
  are audit decisions; neither action deletes content automatically. The admin
  opens the target and explicitly deletes it when removal is justified.
- Deleting a question or answer removes reports that target it, preventing
  inaccessible orphan records in the polymorphic reports table.

Every mutation revalidates the Auth user in the Server Action. Editable columns
are whitelisted, the reporter ID comes from Auth, and owner/admin enforcement
remains in PostgreSQL RLS. UI visibility is only convenience, never the security
boundary.

## Durable limits

The migration enforces limits in PostgreSQL, including direct API writes:

| Action | Short limit | Daily limit |
| --- | ---: | ---: |
| Questions | 3 per 10 minutes | 15 per 24 hours |
| Answers | 10 per 10 minutes | 60 per 24 hours |
| Reports | 5 per hour | 20 per 24 hours |

Concurrent duplicate reports are serialized with a transaction advisory lock.
Length constraints are added `NOT VALID`: new and edited rows are checked, while
legacy content cannot make deployment fail. The rate limits are abuse brakes,
not a complete reputation, CAPTCHA or ban system.

## Deploy and verify

Run this from the project directory after switching to the feature branch:

```sh
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

No migration-history repair should be needed. The dry run should list only
`20260916200000_forum_moderation_controls.sql`. Stop if it lists an older
migration or reports a schema conflict.

Local database policy tests require Docker and the Supabase local stack:

```sh
npx supabase start
npx supabase test db
```

This workspace had no Docker daemon, so the pgTAP file was authored but not run
here. Application verification completed with 68 native tests, TypeScript, lint,
the production build and controlled SSR/action checks. Before merge, use two
real student accounts plus the admin account to verify ownership, report review,
duplicate/self-report denial and the configured rate limit.
