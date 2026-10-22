# Launch fixes: deployment steps

## Apply the resource insert policy

The application now accepts both uploads and Google Drive/Docs submissions while
requiring ownership and pending moderation. Deploying frontend code alone does
not change the database policy.

After checking that this is the intended Supabase project, apply migrations with
your normal linked CLI workflow:

```sh
npx supabase db push --dry-run
npx supabase db push
```

Review the dry run first: a database with older migrations missing may need more
than this change. Alternatively, run the complete contents of
`supabase/migrations/20261023010000_allow_pending_external_resource_inserts.sql`
in the project's SQL Editor **after** the earlier external-resources migration
`20260930220000_external_resources_and_admin_access.sql` is applied. Neither
migration changes existing resource statuses.

The database regression suite is
`supabase/tests/database/resource_insert_policy.test.sql` (17 assertions). Run
with `supabase test db` against a local test project, not production. It verifies
pending uploads/Drive/Docs, forged uploaders, approval bypass, host lookalikes,
mixed locations and anonymous inserts.

## Enable password recovery on the deployed domain

Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin in the hosting environment.
In Supabase Authentication URL Configuration, use that production Site URL and
allow both callback URLs (replace the example origin):

- `https://YOUR_DOMAIN/auth/callback`
- `https://YOUR_DOMAIN/en/auth/callback`

Keep Supabase's recovery template using `{{ .ConfirmationURL }}` for the
standard PKCE flow. Recovery links requested in the app must be opened in the
same browser, since that browser holds the PKCE verifier cookie. The recovery
callback also supports a custom template using `token_hash` and `type=recovery`;
if you choose that configuration, use the locale-aware callback from
`{{ .RedirectTo }}` and append `&token_hash={{ .TokenHash }}&type=recovery`.
Do not link directly to the reset form without verifying the token.

Confirm the email provider/SMTP configuration can deliver recovery and signup
messages to real student email addresses. No real emails or production Auth
settings were changed during implementation.

Manually verify on the deployed site:

1. Request recovery for a test account, receive the email, open it in the same
   browser, set a new password, then sign in with that password.
2. Reuse the consumed link and check the new-link prompt. Repeat in English.
3. Submit one PDF and one Google Drive link as a student; both must appear as
   pending, and become public only after admin approval.
4. Search for a known course by name/code and open the result for the correct
   major. Test a database outage separately from an empty course.

## Existing university requirements links

The curated 61-link section remains available as repository-managed content.
It was intentionally not imported into student-owned database rows without an
explicit uploader and course mapping. It still opens original external links;
its records do not participate in the database moderation/download counters.
