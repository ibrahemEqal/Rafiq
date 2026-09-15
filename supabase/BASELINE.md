# Existing database baseline

`20260913214656_remote_schema.sql` is a snapshot of the existing database,
not a migration to rerun against a populated deployment.

Before marking it applied on the existing deployment, the live public schema
was compared to this snapshot. Tables, columns, enums, constraints, indexes,
functions and public triggers matched. Intentional policy differences were:

- `Allow authenticated inserts` had already been removed.
- `authenticated users upload resources` was scoped to `authenticated`.

The auth signup trigger, resource storage policies, resource bucket and required
extensions were also checked separately. The bucket was still public. Registering
the old baseline only records migration history; it does not restore old policies.
Do not mark later security migrations applied without executing them.

On a fresh local database, apply all migrations normally instead of repairing
history. The two subsequent migrations privatize resource storage and enforce
pending, owner-scoped resource inserts. Existing resource rows are not rewritten
by the pending-insert migration. Authenticated admins also insert pending rows;
approval is a separate admin update. Service-role connections bypass RLS and
must remain trusted and server-side.

`tests/database/resource_insert_policy.test.sql` contains transactional pgTAP
regression tests for ownership, folder paths, initial status, anonymous inserts,
and the existing self-moderation trigger. It deliberately introduces an unsafe
permissive policy inside the rolled-back test to check the restrictive guard.
Run these tests only on a local/test database with `supabase test db` after
applying migrations. These tests are not run by the frontend CI workflow.
