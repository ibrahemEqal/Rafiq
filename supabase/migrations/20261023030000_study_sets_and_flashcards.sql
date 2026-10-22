begin;

create table public.study_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  subject text not null default '' check (char_length(subject) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  share_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_sets_owner_updated_idx on public.study_sets(owner_id, updated_at desc, id);

create table public.study_cards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.study_sets(id) on delete cascade,
  front text not null check (char_length(btrim(front)) between 1 and 800),
  back text not null check (char_length(btrim(back)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique(id, set_id)
);
create index study_cards_set_idx on public.study_cards(set_id, created_at, id);

create table public.study_materials (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.study_sets(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  url text not null check (char_length(url) <= 1200 and (url ~ '^https://' or url ~ '^/resources/[a-fA-F0-9-]{36}$')),
  created_at timestamptz not null default now()
);
create index study_materials_set_idx on public.study_materials(set_id, created_at, id);

create table public.study_card_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null,
  set_id uuid not null,
  remembered boolean not null,
  streak integer not null check (streak between 0 and 5),
  review_count integer not null check (review_count >= 1),
  reviewed_at timestamptz not null default now(),
  next_review_at timestamptz not null,
  primary key (user_id, card_id),
  foreign key(card_id, set_id) references public.study_cards(id, set_id) on delete cascade
);
create index study_reviews_user_set_idx on public.study_card_reviews(user_id, set_id, next_review_at);

alter table public.study_sets enable row level security;
alter table public.study_cards enable row level security;
alter table public.study_materials enable row level security;
alter table public.study_card_reviews enable row level security;

-- Shared content is accessed ONLY through a random capability token RPC below.
-- Direct table queries never list shared sets, tokens or other people's cards.
create policy study_sets_owner on public.study_sets for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy study_cards_owner on public.study_cards for all to authenticated
  using (exists(select 1 from public.study_sets s where s.id = set_id and s.owner_id = auth.uid()))
  with check (exists(select 1 from public.study_sets s where s.id = set_id and s.owner_id = auth.uid()));
create policy study_materials_owner on public.study_materials for all to authenticated
  using (exists(select 1 from public.study_sets s where s.id = set_id and s.owner_id = auth.uid()))
  with check (exists(select 1 from public.study_sets s where s.id = set_id and s.owner_id = auth.uid()));
create policy study_reviews_personal on public.study_card_reviews for select to authenticated
  using (user_id = auth.uid());

revoke all on public.study_sets, public.study_cards, public.study_materials, public.study_card_reviews from anon, authenticated;
grant select, insert, update, delete on public.study_sets, public.study_cards, public.study_materials to authenticated;
grant select on public.study_card_reviews to authenticated;

create function public.study_set_update_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.visibility = 'private' and old.visibility = 'shared' then
    new.share_token := gen_random_uuid();
  end if;
  return new;
end;
$$;
create trigger study_set_update_guard before update on public.study_sets
  for each row execute function public.study_set_update_guard();

-- Serialize quota checks on the owning user/set to avoid concurrent INSERT
-- races. This function returns no auth metadata to the caller.
create function public.study_content_limits() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'study_sets' then
    perform id from auth.users where id = new.owner_id for update;
    if (select count(*) from public.study_sets where owner_id = new.owner_id) >= 100 then
      raise exception 'study_limit' using errcode = 'P0001';
    end if;
  else
    if tg_op = 'UPDATE' and old.set_id = new.set_id then return new; end if;
    perform id from public.study_sets where id = new.set_id for update;
    if tg_table_name = 'study_cards' then
      if (select count(*) from public.study_cards where set_id = new.set_id) >= 300 then
        raise exception 'study_limit' using errcode = 'P0001';
      end if;
    elsif (select count(*) from public.study_materials where set_id = new.set_id) >= 100 then
      raise exception 'study_limit' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger study_sets_limit before insert on public.study_sets for each row execute function public.study_content_limits();
create trigger study_cards_limit before insert or update of set_id on public.study_cards for each row execute function public.study_content_limits();
create trigger study_materials_limit before insert or update of set_id on public.study_materials for each row execute function public.study_content_limits();

create function public.get_shared_study_set(token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id, 'title', s.title, 'subject', s.subject, 'description', s.description,
    'visibility', s.visibility,
    'cards', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'front', c.front, 'back', c.back) order by c.created_at, c.id) from public.study_cards c where c.set_id = s.id), '[]'::jsonb),
    'materials', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'title', m.title, 'url', m.url) order by m.created_at, m.id) from public.study_materials m where m.set_id = s.id), '[]'::jsonb)
  ) from public.study_sets s where s.share_token = token and s.visibility = 'shared';
$$;
revoke all on function public.get_shared_study_set(uuid) from public;
grant execute on function public.get_shared_study_set(uuid) to anon, authenticated;

-- No direct review INSERT/UPDATE grants: verify source access on every rating.
create function public.review_study_card(target_card uuid, knew boolean, access_token uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  reader uuid := auth.uid();
  parent record;
  next_streak integer;
  result public.study_card_reviews;
begin
  if reader is null or knew is null then raise exception 'study_unauthorized' using errcode = '42501'; end if;
  select s.id, s.owner_id, s.visibility, s.share_token into parent
    from public.study_cards c join public.study_sets s on s.id = c.set_id
    where c.id = target_card for share of s, c;
  if not found or not coalesce(parent.owner_id = reader or (parent.visibility = 'shared' and parent.share_token = access_token), false) then
    raise exception 'study_not_found' using errcode = '42501';
  end if;
  -- One user's reviews are serialized on the Auth row, including first reviews.
  perform id from auth.users where id = reader for update;
  select case when knew then least(coalesce(r.streak, 0) + 1, 5) else 0 end
    into next_streak from public.study_card_reviews r where r.user_id = reader and r.card_id = target_card;
  next_streak := coalesce(next_streak, case when knew then 1 else 0 end);
  insert into public.study_card_reviews(user_id, card_id, set_id, remembered, streak, review_count, reviewed_at, next_review_at)
    values(reader, target_card, parent.id, knew, next_streak, 1, now(),
      now() + case next_streak when 0 then interval '10 minutes' when 1 then interval '1 day' when 2 then interval '3 days' when 3 then interval '7 days' when 4 then interval '14 days' else interval '30 days' end)
    on conflict(user_id, card_id) do update set remembered = excluded.remembered, streak = excluded.streak,
      review_count = public.study_card_reviews.review_count + 1, reviewed_at = excluded.reviewed_at, next_review_at = excluded.next_review_at
    returning * into result;
  return jsonb_build_object('card_id', result.card_id, 'remembered', result.remembered, 'next_review_at', result.next_review_at);
end;
$$;
revoke all on function public.review_study_card(uuid, boolean, uuid) from public, anon, authenticated;
grant execute on function public.review_study_card(uuid, boolean, uuid) to authenticated;

revoke all on function public.study_set_update_guard() from public, anon, authenticated;
revoke all on function public.study_content_limits() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
