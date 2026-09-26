begin;

create table public.answer_reactions (
  answer_id uuid not null references public.answers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);

create table public.answer_comments (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint answer_comments_body_length
    check (char_length(btrim(body)) between 2 and 1000)
);

create index idx_answer_reactions_user_created
  on public.answer_reactions (user_id, created_at desc);
create index idx_answer_comments_answer_created
  on public.answer_comments (answer_id, created_at asc, id asc);
create index idx_answer_comments_author_created
  on public.answer_comments (author_id, created_at desc);

alter table public.answer_reactions enable row level security;
alter table public.answer_comments enable row level security;

create policy "answer reactions are publicly readable"
  on public.answer_reactions for select using (true);

create policy "students react once to other students answers"
  on public.answer_reactions for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.answers a
      where a.id = answer_id and a.author_id = auth.uid()
    )
  );

create policy "students remove their own answer reactions"
  on public.answer_reactions for delete to authenticated
  using (auth.uid() = user_id);

create policy "answer comments are publicly readable"
  on public.answer_comments for select using (true);

create policy "authenticated students comment on answers"
  on public.answer_comments for insert to authenticated
  with check (auth.uid() = author_id);

create policy "owners and admins delete answer comments"
  on public.answer_comments for delete to authenticated
  using (auth.uid() = author_id or public.is_admin(auth.uid()));

grant select on table public.answer_reactions, public.answer_comments to anon;
grant select, insert, delete on table public.answer_reactions, public.answer_comments to authenticated;
grant all on table public.answer_reactions, public.answer_comments to service_role;

alter table public.forum_rate_events
  drop constraint if exists forum_rate_events_action_check;
alter table public.forum_rate_events
  add constraint forum_rate_events_action_check
  check (action in ('question', 'answer', 'report', 'request', 'request_response', 'answer_comment'));

create or replace function public.enforce_forum_rate_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  recent_count integer;
  daily_count integer;
  event_type text;
begin
  if actor is null and current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if actor is null then
    raise exception using errcode = '42501', message = 'forum_auth_required';
  end if;

  if tg_table_name = 'questions' or tg_table_name = 'answers' or tg_table_name = 'answer_comments' then
    if new.author_id <> actor then
      raise exception using errcode = '42501', message = 'forum_author_mismatch';
    end if;
    event_type := case tg_table_name
      when 'questions' then 'question'
      when 'answers' then 'answer'
      else 'answer_comment'
    end;
  elsif tg_table_name = 'requests' then
    if new.requester_id <> actor then
      raise exception using errcode = '42501', message = 'requester_mismatch';
    end if;
    event_type := 'request';
  elsif tg_table_name = 'request_responses' then
    if new.author_id <> actor then
      raise exception using errcode = '42501', message = 'response_author_mismatch';
    end if;
    event_type := 'request_response';
  else
    raise exception using errcode = 'P0001', message = 'unsupported_rate_event';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor::text || ':' || event_type || ':rate', 0));
  delete from public.forum_rate_events
    where actor_id = actor and created_at < clock_timestamp() - interval '24 hours';
  select count(*) into recent_count from public.forum_rate_events
    where actor_id = actor and action = event_type
      and created_at >= clock_timestamp() - interval '10 minutes';
  select count(*) into daily_count from public.forum_rate_events
    where actor_id = actor and action = event_type
      and created_at >= clock_timestamp() - interval '24 hours';

  if (event_type = 'question' and (recent_count >= 3 or daily_count >= 15))
     or (event_type = 'answer' and (recent_count >= 10 or daily_count >= 60))
     or (event_type = 'answer_comment' and (recent_count >= 15 or daily_count >= 100))
     or (event_type = 'request' and (recent_count >= 5 or daily_count >= 20))
     or (event_type = 'request_response' and (recent_count >= 10 or daily_count >= 60)) then
    raise exception using errcode = 'P0001', message = 'forum_rate_limited';
  end if;

  insert into public.forum_rate_events (actor_id, action) values (actor, event_type);
  return new;
end;
$$;

create trigger trg_answer_comments_rate_limit
before insert on public.answer_comments
for each row execute function public.enforce_forum_rate_limits();

commit;
