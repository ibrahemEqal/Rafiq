-- Run against a local test project with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
 ('fdd00000-0000-4000-8000-000000000001', 'confirmed@example.invalid', now(),
  '{"username":"email_fixture_confirmed","full_name":"Confirmed fixture"}'),
 ('fdd00000-0000-4000-8000-000000000002', 'pending@example.invalid', null,
  '{"username":"email_fixture_pending","full_name":"Pending fixture"}');

set local role anon;
select is(public.signup_email_exists('confirmed@example.invalid'), true, 'confirmed accounts are registered');
select is(public.signup_email_exists('pending@example.invalid'), true, 'unconfirmed accounts are also registered');
select is(public.signup_email_exists('  PENDING@EXAMPLE.INVALID  '), true, 'email matching ignores case and surrounding whitespace');
select is(public.signup_email_exists('new@example.invalid'), false, 'a new address can continue signup');
select is(public.signup_email_exists(null), false, 'null input does not enumerate accounts');
select is(public.signup_email_exists(repeat('x', 255)), false, 'oversized input is bounded');
select is(public.signup_email_exists('pending%'), false, 'lookup uses exact equality, never wildcard matching');
reset role;
set local role authenticated;
select is(public.signup_email_exists('pending@example.invalid'), true, 'authenticated callers use the same result');
reset role;
select * from finish();
rollback;
