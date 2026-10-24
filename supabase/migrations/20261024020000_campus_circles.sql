begin;
create table public.campus_circles(
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(char_length(btrim(title)) between 5 and 120),
  description text not null check(char_length(btrim(description)) between 10 and 1200),
  kind text not null check(kind in ('study','exchange','break')),
  location text not null check(char_length(btrim(location)) between 3 and 120),
  starts_at timestamptz not null,
  duration integer not null check(duration between 15 and 240),
  capacity integer not null check(capacity between 2 and 12),
  status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now()
);
create index campus_circles_upcoming on public.campus_circles(status,starts_at);
create index campus_circles_host on public.campus_circles(host_id,created_at);
create table public.campus_circle_members(
  circle_id uuid not null references public.campus_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(circle_id,user_id)
);
create index campus_circle_member_user on public.campus_circle_members(user_id,circle_id);
alter table public.campus_circles enable row level security;
alter table public.campus_circle_members enable row level security;
create policy circles_host on public.campus_circles for select to authenticated using(host_id=auth.uid());
create policy circles_personal_membership on public.campus_circle_members for select to authenticated using(user_id=auth.uid());
revoke all on public.campus_circles,public.campus_circle_members from anon,authenticated;
grant select on public.campus_circles,public.campus_circle_members to authenticated;

create table public.campus_circle_reports(
  circle_id uuid not null references public.campus_circles(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check(char_length(btrim(reason)) between 10 and 1000),
  status text not null default 'pending' check(status in ('pending','resolved')),
  created_at timestamptz not null default now(),
  primary key(circle_id,reporter_id)
);
alter table public.campus_circle_reports enable row level security;
create policy circles_reports_private on public.campus_circle_reports for select to authenticated using(reporter_id=auth.uid() or public.is_admin(auth.uid()));
revoke all on public.campus_circle_reports from anon,authenticated;
grant select on public.campus_circle_reports to authenticated;
create function public.report_campus_circle(target uuid,report_reason text)returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();row public.campus_circles;
begin
 if actor is null then raise exception 'circle_unauthorized' using errcode='42501';end if;
 if report_reason is null or char_length(btrim(report_reason))not between 10 and 1000 then raise exception 'circle_invalid' using errcode='22023';end if;
 select * into row from public.campus_circles where id=target for share;
 if not found then raise exception 'circle_notFound' using errcode='P0001';end if;
 if row.host_id=actor then raise exception 'circle_host' using errcode='P0001';end if;
 if row.status<>'open' or row.starts_at+make_interval(mins=>row.duration)<=now()then raise exception 'circle_ended' using errcode='P0001';end if;
 perform id from auth.users where id=actor for update;
 if exists(select 1 from public.campus_circle_reports where circle_id=target and reporter_id=actor and status='pending')then return jsonb_build_object('id',target);end if;
 if(select count(*)from public.campus_circle_reports where reporter_id=actor and created_at>now()-interval '1 day')>=10 then raise exception 'circle_limit' using errcode='P0001';end if;
 insert into public.campus_circle_reports(circle_id,reporter_id,reason)values(target,actor,btrim(report_reason))
 on conflict(circle_id,reporter_id)do update set reason=excluded.reason,status='pending',created_at=now();
 return jsonb_build_object('id',target);
end;$$;

create function public.create_campus_circle(details jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); row public.campus_circles;
begin
  if actor is null then raise exception 'circle_unauthorized' using errcode='42501';end if;
  if details is null or jsonb_typeof(details)<>'object' or octet_length(details::text)>10000 then raise exception 'circle_invalid' using errcode='22023';end if;
  perform id from auth.users where id=actor for update;
  if (select count(*) from public.campus_circles where host_id=actor and created_at>now()-interval '1 day')>=5 then raise exception 'circle_limit' using errcode='P0001';end if;
  if (details->>'starts_at')::timestamptz<now()-interval '1 minute' or (details->>'starts_at')::timestamptz>now()+interval '90 days' then raise exception 'circle_ended' using errcode='P0001';end if;
  insert into public.campus_circles(host_id,title,description,kind,location,starts_at,duration,capacity)
  values(actor,btrim(details->>'title'),btrim(details->>'description'),details->>'kind',btrim(details->>'location'),(details->>'starts_at')::timestamptz,(details->>'duration')::integer,(details->>'capacity')::integer) returning * into row;
  insert into public.campus_circle_members(circle_id,user_id)values(row.id,actor);
  return jsonb_build_object('id',row.id);
end;$$;
create function public.act_campus_circle(target uuid,operation text)returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();row public.campus_circles;
begin
  if actor is null then raise exception 'circle_unauthorized' using errcode='42501';end if;
  select * into row from public.campus_circles where id=target for update;
  if not found then raise exception 'circle_notFound' using errcode='P0001';end if;
  if operation='close' then
    if row.host_id<>actor and not public.is_admin(actor) then raise exception 'circle_host' using errcode='42501';end if;
    update public.campus_circles set status='closed' where id=target;
    update public.campus_circle_reports set status='resolved' where circle_id=target;
  elsif operation='dismiss' then
    if not public.is_admin(actor)then raise exception 'circle_host' using errcode='42501';end if;
    update public.campus_circle_reports set status='resolved' where circle_id=target;
  elsif operation='leave' then
    if row.host_id=actor then raise exception 'circle_host' using errcode='P0001';end if;
    delete from public.campus_circle_members where circle_id=target and user_id=actor;
  elsif operation='join' then
    if row.status<>'open' or row.starts_at+make_interval(mins=>row.duration)<=now() then raise exception 'circle_ended' using errcode='P0001';end if;
    if not exists(select 1 from public.campus_circle_members where circle_id=target and user_id=actor) then
      if(select count(*)from public.campus_circle_members where circle_id=target)>=row.capacity then raise exception 'circle_full' using errcode='P0001';end if;
      insert into public.campus_circle_members(circle_id,user_id)values(target,actor);
    end if;
  else raise exception 'circle_invalid' using errcode='22023';end if;
  return jsonb_build_object('id',target);
end;$$;
create function public.list_campus_circles(only_mine boolean default false,target_circle uuid default null)returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(item order by sort_time),'[]'::jsonb)from(
    select case when only_mine is true then -extract(epoch from c.starts_at) else extract(epoch from c.starts_at) end - case when public.is_admin(auth.uid()) and exists(select 1 from public.campus_circle_reports r where r.circle_id=c.id and r.status='pending') then 1000000000000 else 0 end as sort_time,jsonb_build_object(
      'id',c.id,'title',c.title,'description',c.description,'kind',c.kind,'location',c.location,'starts_at',c.starts_at,'duration',c.duration,'capacity',c.capacity,'status',c.status,
      'host',coalesce(p.username,'Rafeeq'),'members',(select count(*)from public.campus_circle_members m where m.circle_id=c.id),
      'joined',exists(select 1 from public.campus_circle_members m where m.circle_id=c.id and m.user_id=auth.uid()),'is_host',coalesce(c.host_id=auth.uid(),false),
      'can_moderate',public.is_admin(auth.uid()),
      'reports',case when public.is_admin(auth.uid())then(select count(*)from public.campus_circle_reports r where r.circle_id=c.id and r.status='pending')else 0 end,
      'moderation_note',case when public.is_admin(auth.uid())then(select r.reason from public.campus_circle_reports r where r.circle_id=c.id and r.status='pending' order by r.created_at desc limit 1)else null end
    )as item from public.campus_circles c left join public.profiles p on p.id=c.host_id
    where (target_circle is null or c.id=target_circle) and (
      (only_mine is true and (c.host_id=auth.uid() or exists(select 1 from public.campus_circle_members m where m.circle_id=c.id and m.user_id=auth.uid())))
      or (only_mine is not true and ((c.status='open' and c.starts_at>now()-interval '4 hours' and c.starts_at+make_interval(mins=>c.duration)>now()) or (target_circle is not null and (c.host_id=auth.uid() or exists(select 1 from public.campus_circle_members m where m.circle_id=c.id and m.user_id=auth.uid())))))
    )order by sort_time limit 40
  )q;
$$;
revoke all on function public.create_campus_circle(jsonb),public.act_campus_circle(uuid,text),public.report_campus_circle(uuid,text),public.list_campus_circles(boolean,uuid)from public,anon,authenticated;
grant execute on function public.create_campus_circle(jsonb),public.act_campus_circle(uuid,text),public.report_campus_circle(uuid,text)to authenticated;
grant execute on function public.list_campus_circles(boolean,uuid)to anon,authenticated;
notify pgrst,'reload schema';
commit;
