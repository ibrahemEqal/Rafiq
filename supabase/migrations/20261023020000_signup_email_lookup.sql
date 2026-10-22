begin;

-- The registration form intentionally reports an already registered address.
-- Return only a boolean for one exact email, including unconfirmed accounts;
-- never expose auth.users rows or copy emails into public profiles.
create or replace function public.signup_email_exists(candidate_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when candidate_email is null
      or pg_catalog.length(pg_catalog.btrim(candidate_email)) > 254
      or pg_catalog.length(pg_catalog.btrim(candidate_email)) < 3
      then false
    else exists (
      select 1 from auth.users as u
      where pg_catalog.lower(u.email) = pg_catalog.lower(pg_catalog.btrim(candidate_email))
    )
  end;
$$;

revoke all on function public.signup_email_exists(text) from public;
grant execute on function public.signup_email_exists(text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
