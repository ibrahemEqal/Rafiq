-- ONE-TIME OWNER OPERATION. This is NOT a migration and is NOT run by the app.
-- Run in Supabase SQL Editor as postgres. Replace ONLY the target_user_id
-- assignment's zero UUID below (leave the later zero-UUID guard unchanged) with
-- the intended existing account's ID from Authentication > Users.
-- Check the returned profile ID/name before using the account as an admin.
-- The script aborts unchanged if the placeholder/user/trigger is invalid.
begin;

do $$
declare
  target_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  if current_user <> 'postgres' then
    raise exception 'Run this owner-only script as postgres in SQL Editor';
  end if;
  if target_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace the placeholder with the intended Auth user ID first';
  end if;

  -- DDL locks the table until commit. Other sessions cannot write while the
  -- named role-update trigger is temporarily disabled inside this transaction.
  lock table public.profiles in access exclusive mode;
  if not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'The target profile does not exist';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'trg_profiles_prevent_role_escalation'
      and tgenabled = 'O'
  ) then
    raise exception 'Expected enabled role-protection trigger was not found';
  end if;

  alter table public.profiles disable trigger trg_profiles_prevent_role_escalation;
  update public.profiles set role = 'admin' where id = target_user_id;
  alter table public.profiles enable trigger trg_profiles_prevent_role_escalation;
end;
$$;

commit;

select id, full_name, username, role
from public.profiles where role = 'admin';
