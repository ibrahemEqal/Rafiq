-- Run with `supabase test db` against a LOCAL database after migrations.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('fac00000-0000-4000-8000-000000000001', 'forum-rls-1@example.invalid', '{"username":"forum_rls_fixture_1","full_name":"Forum One"}'),
  ('fac00000-0000-4000-8000-000000000002', 'forum-rls-2@example.invalid', '{"username":"forum_rls_fixture_2","full_name":"Forum Two"}');

prepare add_question(uuid, uuid, text) as
insert into public.questions (id, author_id, title, body)
values ($1, $2, $3, 'A sufficiently detailed question body.');

select set_config('request.jwt.claim.sub', 'fac00000-0000-4000-8000-000000000001', true);
set local role authenticated;

select lives_ok(
  $$execute add_question('fac00000-0000-4000-8000-000000000010', 'fac00000-0000-4000-8000-000000000001', 'First valid question')$$,
  'authenticated author can create a question'
);
select throws_ok(
  $$execute add_question('fac00000-0000-4000-8000-000000000011', 'fac00000-0000-4000-8000-000000000002', 'Forged author question')$$,
  '42501', null, 'question author cannot be forged'
);
select lives_ok(
  $$execute add_question('fac00000-0000-4000-8000-000000000012', 'fac00000-0000-4000-8000-000000000001', 'Second valid question')$$,
  'second question is within the short limit'
);
select lives_ok(
  $$execute add_question('fac00000-0000-4000-8000-000000000013', 'fac00000-0000-4000-8000-000000000001', 'Third valid question')$$,
  'third question is within the short limit'
);
select throws_ok(
  $$execute add_question('fac00000-0000-4000-8000-000000000014', 'fac00000-0000-4000-8000-000000000001', 'Fourth blocked question')$$,
  'P0001', 'forum_rate_limited', 'fourth question inside ten minutes is blocked'
);
select throws_ok(
  $$insert into public.reports (reporter_id, target_type, target_id, reason)
    values ('fac00000-0000-4000-8000-000000000001', 'question', 'fac00000-0000-4000-8000-000000000010', 'Trying to report my own question')$$,
  '23514', 'self_report_forbidden', 'authors cannot report their own content'
);

reset role;
select set_config('request.jwt.claim.sub', 'fac00000-0000-4000-8000-000000000002', true);
set local role authenticated;

select lives_ok(
  $$insert into public.reports (reporter_id, target_type, target_id, reason, status)
    values ('fac00000-0000-4000-8000-000000000002', 'question', 'fac00000-0000-4000-8000-000000000010', 'This question requires moderator review', 'reviewed')$$,
  'another user can report existing content'
);
select results_eq(
  $$select status::text from public.reports
    where reporter_id = 'fac00000-0000-4000-8000-000000000002'
      and target_id = 'fac00000-0000-4000-8000-000000000010'$$,
  array['pending'::text], 'new report status is forced to pending'
);
select throws_ok(
  $$insert into public.reports (reporter_id, target_type, target_id, reason)
    values ('fac00000-0000-4000-8000-000000000002', 'question', 'fac00000-0000-4000-8000-000000000010', 'Duplicate report should be rejected')$$,
  '23505', 'duplicate_pending_report', 'duplicate pending report is rejected atomically'
);
select throws_ok(
  $$insert into public.reports (reporter_id, target_type, target_id, reason)
    values ('fac00000-0000-4000-8000-000000000002', 'question', 'fac00000-0000-4000-8000-000000000099', 'Missing target should be rejected')$$,
  '23503', 'report_target_missing', 'reports must reference an existing target'
);
select is_empty(
  $$update public.questions set title = 'Unauthorized edit attempt'
    where id = 'fac00000-0000-4000-8000-000000000010' returning id$$,
  'non-owner cannot update another user question'
);

reset role;
select set_config('request.jwt.claim.sub', 'fac00000-0000-4000-8000-000000000001', true);
set local role authenticated;
select results_eq(
  $$update public.questions set title = 'Owner edited question'
    where id = 'fac00000-0000-4000-8000-000000000010' returning title$$,
  array['Owner edited question'::text], 'owner can edit a question'
);
select lives_ok(
  $$delete from public.questions where id = 'fac00000-0000-4000-8000-000000000010'$$,
  'owner can delete a question'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
select is(
  (select count(*) from public.reports where target_id = 'fac00000-0000-4000-8000-000000000010'),
  0::bigint, 'deleting a target cleans up its polymorphic reports'
);

deallocate add_question;
select * from finish();
rollback;
