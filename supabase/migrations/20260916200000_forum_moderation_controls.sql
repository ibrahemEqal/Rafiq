begin;

-- Keep legacy rows deployable while enforcing sane limits for every new or
-- changed forum row. NOT VALID deliberately avoids failing on old content.
alter table public.questions
  add constraint questions_title_length check (char_length(btrim(title)) between 5 and 160) not valid,
  add constraint questions_body_length check (char_length(btrim(body)) between 10 and 8000) not valid;

alter table public.answers
  add constraint answers_body_length check (char_length(btrim(body)) between 2 and 8000) not valid;

alter table public.reports
  add constraint reports_reason_length check (char_length(btrim(reason)) between 10 and 1000) not valid;

-- A private append-only event ledger prevents delete-and-repost from resetting
-- limits. RLS plus explicit revokes keep it out of the public Data API.
create table if not exists public.forum_rate_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  action text not null check (action in ('question', 'answer', 'report')),
  created_at timestamptz not null default clock_timestamp()
);
alter table public.forum_rate_events enable row level security;
revoke all on table public.forum_rate_events from public, anon, authenticated;
revoke all on sequence public.forum_rate_events_id_seq from public, anon, authenticated;
create index if not exists idx_forum_rate_events_actor_action_created
  on public.forum_rate_events (actor_id, action, created_at desc);

create index if not exists idx_questions_author_created_at
  on public.questions (author_id, created_at desc);
create index if not exists idx_answers_author_created_at
  on public.answers (author_id, created_at desc);
create index if not exists idx_reports_reporter_created_at
  on public.reports (reporter_id, created_at desc);

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

  if tg_table_name = 'questions' then
    if new.author_id <> actor then
      raise exception using errcode = '42501', message = 'forum_author_mismatch';
    end if;
    event_type := 'question';
  elsif tg_table_name = 'answers' then
    if new.author_id <> actor then
      raise exception using errcode = '42501', message = 'forum_author_mismatch';
    end if;
    event_type := 'answer';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor::text || ':' || event_type || ':rate', 0));
  delete from public.forum_rate_events where actor_id = actor and created_at < clock_timestamp() - interval '24 hours';
  select count(*) into recent_count from public.forum_rate_events
    where actor_id = actor and action = event_type and created_at >= clock_timestamp() - interval '10 minutes';
  select count(*) into daily_count from public.forum_rate_events
    where actor_id = actor and action = event_type and created_at >= clock_timestamp() - interval '24 hours';
  if (event_type = 'question' and (recent_count >= 3 or daily_count >= 15))
     or (event_type = 'answer' and (recent_count >= 10 or daily_count >= 60)) then
    raise exception using errcode = 'P0001', message = 'forum_rate_limited';
  end if;
  insert into public.forum_rate_events (actor_id, action) values (actor, event_type);

  return new;
end;
$$;

drop trigger if exists trg_questions_rate_limit on public.questions;
create trigger trg_questions_rate_limit
before insert on public.questions
for each row execute function public.enforce_forum_rate_limits();

drop trigger if exists trg_answers_rate_limit on public.answers;
create trigger trg_answers_rate_limit
before insert on public.answers
for each row execute function public.enforce_forum_rate_limits();

create or replace function public.validate_forum_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  owner_id uuid;
  report_key bigint;
  hourly_count integer;
  daily_count integer;
begin
  if actor is null and current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if actor is null or new.reporter_id <> actor then
    raise exception using errcode = '42501', message = 'reporter_mismatch';
  end if;

  -- Serialize identical reports so two concurrent requests cannot both pass.
  report_key := hashtextextended(actor::text || ':' || new.target_type::text || ':' || new.target_id::text, 0);
  perform pg_advisory_xact_lock(report_key);

  if new.target_type = 'question' then
    select q.author_id into owner_id from public.questions q where q.id = new.target_id;
  elsif new.target_type = 'answer' then
    select a.author_id into owner_id from public.answers a where a.id = new.target_id;
  elsif new.target_type = 'resource' then
    select r.uploader_id into owner_id from public.resources r where r.id = new.target_id;
  elsif new.target_type = 'book_offer' then
    select b.owner_id into owner_id from public.books b where b.id = new.target_id;
  elsif new.target_type = 'request' then
    select r.requester_id into owner_id from public.requests r where r.id = new.target_id;
  end if;

  if owner_id is null then
    raise exception using errcode = '23503', message = 'report_target_missing';
  end if;
  if owner_id = actor then
    raise exception using errcode = '23514', message = 'self_report_forbidden';
  end if;
  if exists (
    select 1 from public.reports
    where reporter_id = actor and target_type = new.target_type
      and target_id = new.target_id and status = 'pending'
  ) then
    raise exception using errcode = '23505', message = 'duplicate_pending_report';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor::text || ':report:rate', 0));
  delete from public.forum_rate_events where actor_id = actor and created_at < clock_timestamp() - interval '24 hours';
  select count(*) into hourly_count from public.forum_rate_events
    where actor_id = actor and action = 'report' and created_at >= clock_timestamp() - interval '1 hour';
  select count(*) into daily_count from public.forum_rate_events
    where actor_id = actor and action = 'report' and created_at >= clock_timestamp() - interval '24 hours';
  if hourly_count >= 5 or daily_count >= 20 then
    raise exception using errcode = 'P0001', message = 'forum_rate_limited';
  end if;
  insert into public.forum_rate_events (actor_id, action) values (actor, 'report');

  new.reason := btrim(new.reason);
  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists trg_reports_validate_forum_target on public.reports;
create trigger trg_reports_validate_forum_target
before insert on public.reports
for each row execute function public.validate_forum_report();

-- Polymorphic reports cannot use a normal foreign key. Remove reports when
-- their question/answer target is deleted, including cascaded answer deletes.
create or replace function public.cleanup_deleted_forum_reports()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.reports
  where target_type = tg_argv[0]::public.report_target_type and target_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_questions_cleanup_reports on public.questions;
create trigger trg_questions_cleanup_reports
after delete on public.questions
for each row execute function public.cleanup_deleted_forum_reports('question');

drop trigger if exists trg_answers_cleanup_reports on public.answers;
create trigger trg_answers_cleanup_reports
after delete on public.answers
for each row execute function public.cleanup_deleted_forum_reports('answer');

revoke all on function public.enforce_forum_rate_limits() from public;
revoke all on function public.validate_forum_report() from public;
revoke all on function public.cleanup_deleted_forum_reports() from public;

commit;
