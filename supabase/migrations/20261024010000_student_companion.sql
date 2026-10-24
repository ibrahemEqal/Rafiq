begin;
create table public.companion_sections (
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check(section in ('profile','tasks','schedule','semester','wallet','capsules','focus')),
  payload jsonb not null check(octet_length(payload::text) <= 512000),
  version integer not null default 1 check(version >= 1),
  updated_at timestamptz not null default now(),
  primary key(user_id,section)
);
alter table public.companion_sections enable row level security;
create policy companion_personal on public.companion_sections for select to authenticated using(user_id=auth.uid());
revoke all on public.companion_sections from anon,authenticated;
grant select on public.companion_sections to authenticated;
create function public.save_companion_section(section_name text,content jsonb,expected_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); current_version integer; max_items integer;
begin
  if actor is null then raise exception 'companion_unauthorized' using errcode='42501'; end if;
  if section_name is null or section_name not in ('profile','tasks','schedule','semester','wallet','capsules','focus') or expected_version is null or expected_version<0 or expected_version>2000000000 or content is null or octet_length(content::text)>512000 then
    raise exception 'companion_invalid' using errcode='22023';
  end if;
  if section_name in ('tasks','schedule','capsules','focus') then
    max_items:=case section_name when 'tasks' then 200 when 'schedule' then 50 when 'capsules' then 40 else 240 end;
    if jsonb_typeof(content)<>'array' or jsonb_array_length(content)>max_items then raise exception 'companion_invalid' using errcode='22023'; end if;
  elsif jsonb_typeof(content)<>'object' then raise exception 'companion_invalid' using errcode='22023';
  elsif section_name='wallet' then
    if coalesce(jsonb_typeof(content->'expenses'),'null')<>'array' or jsonb_array_length(content->'expenses')>400 then raise exception 'companion_invalid' using errcode='22023'; end if;
  elsif section_name='semester' then
    if coalesce(jsonb_typeof(content->'courses'),'null')<>'array' or jsonb_array_length(content->'courses')>20 then raise exception 'companion_invalid' using errcode='22023'; end if;
  end if;
  -- Serializes first writes too. An outdated device cannot overwrite a newer version.
  perform id from auth.users where id=actor for update;
  select version into current_version from public.companion_sections where user_id=actor and section=section_name;
  if coalesce(current_version,0)<>expected_version then raise exception 'companion_conflict' using errcode='P0001'; end if;
  insert into public.companion_sections(user_id,section,payload,version) values(actor,section_name,content,expected_version+1)
  on conflict(user_id,section) do update set payload=excluded.payload,version=excluded.version,updated_at=now();
  return jsonb_build_object('version',expected_version+1);
end;
$$;
revoke all on function public.save_companion_section(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.save_companion_section(text,jsonb,integer) to authenticated;
notify pgrst,'reload schema';
commit;
