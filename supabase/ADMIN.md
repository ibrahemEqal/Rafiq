# Resource review dashboard

No role table or schema migration is needed. The existing `profiles.role`
(`student` / `admin`), `is_admin(auth.uid())`, RLS and moderation trigger are used.

1. Create/sign in to the intended account normally. Find its UUID in Supabase
   Authentication > Users and verify that it is your intended admin account.
2. To bootstrap that account, copy `admin-bootstrap.sql` into SQL Editor, replace
   ONLY the UUID in the `target_user_id` assignment with that account ID (leave
   the later zero-UUID guard unchanged), and run as `postgres`. This is a privileged
   one-time owner operation, not a migration or a publicly callable RPC.
   It promotes exactly that profile inside a transaction. It briefly locks
   `profiles`, disables ONLY its role-change guard, promotes the selected ID,
   and reenables the guard before commit. No profile or upload is deleted.
   Failure rolls the operation back. Use a quiet deployment window.
3. Sign in to the app with that account, then open `/dashboard` (Arabic) or
   `/en/dashboard`. The admin navigation link is also shown on mobile.
4. Inspect pending files using a 60-second signed attachment download. Review
   downloads do not increment public download counters. Approve/reject pending
   files, unpublish approved files, or return rejected/unpublished files to review.

Every action verifies the Auth user and reads the current role from the database.
Client metadata is not trusted. Database calls use the user's cookie-backed
client, not a service-role key. The old status is checked atomically to avoid
overwriting another review; returned status is checked against trigger reversion.
Rejecting/unpublishing does not delete the stored file. Already issued signed
links may remain usable until their short expiration.

Run `node --experimental-strip-types --test tests/*.test.mjs` on Node 22.6+ for
mock-client authorization/transition regression tests. These are not live RLS
tests. Before deployment, test with real admin and student sessions: student
direct dashboard access must fail; student direct status updates must not approve
files; admin approval must persist and permit public download. No live Supabase
credentials are bundled or required for frontend CI.

## Full content controls and bulk resource approval

Apply `supabase/migrations/20261029010000_admin_content_controls.sql` in the project's
SQL Editor as the project owner, then deploy the matching frontend. No role change
is needed for an existing `profiles.role = 'admin'` account. The migration does not
promote any user, disable RLS, or approve existing pending resources on its own.

- `/dashboard`: **Approve all** approves every row still pending when the database
  statement executes, including rows outside the current page and beyond the
  PostgREST 1,000-row response limit. The confirmation states this scope; the UI
  shows the actual affected count. Repeating the operation returns zero if none remain.
- `/dashboard/manage`: searchable, paginated administration of resources,
  university requirement links, books, requests/responses, questions/answers/comments,
  public campus circles, profiles/roles, universities, colleges, majors, and courses.
  Resource edits include title, description, type, course association and external link.
- Existing university links are seeded into `curated_resources` with public read-only
  RLS. The public resource page uses this table after rollout, retaining file fallback
  only when that table has not been deployed. Renaming a university requirement course
  updates its group of links; it does not rename catalog course rows.
- Mutations require an admin verified by both the Server Action and the RPC. The
  server uses the request's cookie-backed client, never a service role credential.
  Private study sets and personal companion notes are not exposed by the editor.
- A version hash prevents stale edits/deletes from overwriting newer data. Role
  changes are serialized; an admin cannot delete their own account or alter their own
  role. Account deletion targets Auth, not an orphaned profile; foreign-key dependencies
  can require content removal first. Active JWTs may last until expiry, but deletion
  removes the profile used for authorization and prevents new sign-ins.
- Catalog parents with children cannot be deleted through the editor. Resource,
  question and request deletion can cascade to dependent interactions; confirmation
  identifies that consequence. Uploaded Storage objects are retained when their
  resource database record is deleted; this avoids irreversible blob loss but may
  require later orphan cleanup. Existing short-lived signed links can remain usable
  until expiry.
- New editor edits/deletes and bulk approvals write an admin-only audit ledger.
  Existing individual moderation actions keep their earlier behavior.

Validation: unit tests in `tests/admin-content-management.test.mjs`, production SSR
and real Server Action checks in `scripts/performance-smoke.mjs`, plus a PGlite
PostgreSQL-engine suite (`npm run test:admin-db`). The engine suite applies the real
migration to controlled schemas and covers >1,000 approvals, auth/role boundaries,
optimistic conflicts, deletions, dependencies, curated links, and audit. It does not
replace a rollout check against the project's actual Supabase Auth, RLS and Storage.
