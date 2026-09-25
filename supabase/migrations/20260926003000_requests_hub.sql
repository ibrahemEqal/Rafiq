begin;

alter table public.requests
  add constraint requests_title_length
    check (char_length(btrim(title)) between 5 and 140) not valid,
  add constraint requests_description_length
    check (description is null or char_length(btrim(description)) between 10 and 2000) not valid;

create table public.request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  whatsapp_number text,
  created_at timestamptz not null default now(),
  constraint request_responses_body_length
    check (char_length(btrim(body)) between 2 and 1000),
  constraint request_responses_whatsapp_length
    check (whatsapp_number is null or char_length(whatsapp_number) between 8 and 20)
);

create index idx_request_responses_request_created
  on public.request_responses (request_id, created_at desc, id desc);
create index idx_request_responses_author_created
  on public.request_responses (author_id, created_at desc);
create index idx_requests_feed
  on public.requests (status, created_at desc, id desc);
create index idx_requests_type_status_created
  on public.requests (type, status, created_at desc, id desc);

alter table public.request_responses enable row level security;

create policy "request responses are publicly readable"
  on public.request_responses for select using (true);

create policy "authenticated users respond to open requests"
  on public.request_responses for insert to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.requests r
      where r.id = request_id and r.status = 'open'
    )
  );

create policy "owners and admins delete request responses"
  on public.request_responses for delete to authenticated
  using (author_id = auth.uid() or public.is_admin(auth.uid()));

grant select on table public.request_responses to anon;
grant select, insert, delete on table public.request_responses to authenticated;
grant all on table public.request_responses to service_role;

-- Extend the existing durable anti-spam ledger rather than adding a second
-- mechanism that could be bypassed by deleting visible rows.
alter table public.forum_rate_events
  drop constraint if exists forum_rate_events_action_check;
alter table public.forum_rate_events
  add constraint forum_rate_events_action_check
  check (action in ('question', 'answer', 'report', 'request', 'request_response'));

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

  if tg_table_name = 'questions' or tg_table_name = 'answers' then
    if new.author_id <> actor then
      raise exception using errcode = '42501', message = 'forum_author_mismatch';
    end if;
    event_type := case when tg_table_name = 'questions' then 'question' else 'answer' end;
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
     or (event_type = 'request' and (recent_count >= 5 or daily_count >= 20))
     or (event_type = 'request_response' and (recent_count >= 10 or daily_count >= 60)) then
    raise exception using errcode = 'P0001', message = 'forum_rate_limited';
  end if;

  insert into public.forum_rate_events (actor_id, action) values (actor, event_type);
  return new;
end;
$$;

drop trigger if exists trg_requests_rate_limit on public.requests;
create trigger trg_requests_rate_limit
before insert on public.requests
for each row execute function public.enforce_forum_rate_limits();

create trigger trg_request_responses_rate_limit
before insert on public.request_responses
for each row execute function public.enforce_forum_rate_limits();

-- Polymorphic report targets have no foreign key, so remove request reports
-- when their target disappears.
drop trigger if exists trg_requests_cleanup_reports on public.requests;
create trigger trg_requests_cleanup_reports
after delete on public.requests
for each row execute function public.cleanup_deleted_forum_reports('request');

commit;
