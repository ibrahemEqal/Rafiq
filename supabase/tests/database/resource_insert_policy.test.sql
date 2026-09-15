-- Run with `supabase test db` against a LOCAL test database after migrations.
-- Fixtures, extension creation, and test writes are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('fdc00000-0000-4000-8000-000000000001', 'resource-rls-1@example.invalid',
   '{"username":"resource_rls_fixture_1","full_name":"RLS Fixture One"}'),
  ('fdc00000-0000-4000-8000-000000000002', 'resource-rls-2@example.invalid',
   '{"username":"resource_rls_fixture_2","full_name":"RLS Fixture Two"}');

insert into public.universities (id, name_ar, name_en, slug)
values ('fdc00000-0000-4000-8000-000000000010', 'Test', 'Test', 'resource-rls-fixture');
insert into public.colleges (id, university_id, name_ar, name_en, slug)
values ('fdc00000-0000-4000-8000-000000000011',
        'fdc00000-0000-4000-8000-000000000010', 'Test', 'Test', 'resource-rls-fixture');
insert into public.majors (id, college_id, name_ar, name_en, slug)
values ('fdc00000-0000-4000-8000-000000000012',
        'fdc00000-0000-4000-8000-000000000011', 'Test', 'Test', 'resource-rls-fixture');
insert into public.courses (id, major_id, code, name_ar, name_en, slug)
values ('fdc00000-0000-4000-8000-000000000013',
        'fdc00000-0000-4000-8000-000000000012', 'RLS001', 'Test', 'Test', 'resource-rls-fixture');

prepare attempt_resource_insert(uuid, public.resource_status, text) as
insert into public.resources
  (uploader_id, course_id, title, type, storage_path, file_size, status)
values
  ($1, 'fdc00000-0000-4000-8000-000000000013', 'RLS fixture', 'summary', $3, 1, $2);

-- Deliberately add a permissive policy in this rolled-back test transaction:
-- the restrictive guard must still prevent bypass through OR-combined policies.
create policy "test only unsafe resource inserts"
on public.resources for insert to public with check (true);

select set_config('request.jwt.claim.sub', 'fdc00000-0000-4000-8000-000000000001', true);
set local role authenticated;

select lives_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000001', 'pending',
    'fdc00000-0000-4000-8000-000000000001/pending.pdf')$$,
  'authenticated users can insert pending resources in their own folder'
);
select throws_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000001', 'approved',
    'fdc00000-0000-4000-8000-000000000001/approved.pdf')$$,
  '42501', null, 'direct INSERT cannot bypass approval'
);
select throws_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000001', 'rejected',
    'fdc00000-0000-4000-8000-000000000001/rejected.pdf')$$,
  '42501', null, 'new resources cannot start rejected'
);
select throws_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000001', 'removed',
    'fdc00000-0000-4000-8000-000000000001/removed.pdf')$$,
  '42501', null, 'new resources cannot start removed'
);
select throws_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000002', 'pending',
    'fdc00000-0000-4000-8000-000000000001/forged.pdf')$$,
  '42501', null, 'uploader identity cannot be forged'
);
select throws_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000001', 'pending',
    'fdc00000-0000-4000-8000-000000000002/foreign.pdf')$$,
  '42501', null, 'resource INSERT must reference the uploader folder'
);
select results_eq(
  $$with changed as (
      update public.resources set status = 'approved'
      where storage_path = 'fdc00000-0000-4000-8000-000000000001/pending.pdf'
      returning status::text
    ) select status from changed$$,
  array['pending'::text], 'existing moderation trigger prevents self-approval via UPDATE'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok(
  $$execute attempt_resource_insert('fdc00000-0000-4000-8000-000000000001', 'pending',
    'fdc00000-0000-4000-8000-000000000001/anonymous.pdf')$$,
  '42501', null, 'anonymous users cannot insert resources'
);
reset role;
deallocate attempt_resource_insert;
select * from finish();
rollback;
