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
