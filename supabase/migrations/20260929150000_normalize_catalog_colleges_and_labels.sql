-- Remove two obsolete bootstrap colleges without losing linked profiles,
-- listings, posts, resources, majors or courses. The official imported
-- colleges are identified by their stable slugs, never by generated UUIDs.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare
  legacy_science constant uuid := '00000000-0000-0000-0000-000000000102';
  legacy_engineering_it constant uuid := '00000000-0000-0000-0000-000000000101';
  najah_id uuid;
  science_id uuid;
  engineering_id uuid;
  it_id uuid;
  destination_college_id uuid;
  destination_major_id uuid;
  destination_course_id uuid;
  old_major record;
  old_course record;
begin
  select id into najah_id
  from public.universities
  where slug = 'an-najah-national-university';

  select id into science_id from public.colleges where university_id = najah_id and slug = 'science';
  select id into engineering_id from public.colleges where university_id = najah_id and slug = 'engineering';
  select id into it_id from public.colleges where university_id = najah_id and slug = 'it-ai';

  if najah_id is null or science_id is null or engineering_id is null or it_id is null then
    raise exception 'Official An-Najah college records are missing; legacy cleanup was not applied';
  end if;

  -- The obsolete Science record contains the old Mathematics bootstrap data.
  for old_major in select * from public.majors where college_id = legacy_science order by id loop
    destination_major_id := null;
    select m.id into destination_major_id
    from public.majors m
    where m.college_id = science_id
      and (m.slug = old_major.slug
        or lower(trim(m.name_ar)) = lower(trim(old_major.name_ar))
        or lower(trim(m.name_en)) = lower(trim(old_major.name_en)))
    order by (m.slug = old_major.slug) desc, m.id
    limit 1;

    if destination_major_id is null then
      update public.majors set college_id = science_id where id = old_major.id;
    else
      for old_course in select * from public.courses where major_id = old_major.id order by id loop
        destination_course_id := null;
        select c.id into destination_course_id
        from public.courses c
        where c.major_id = destination_major_id
          and (c.code = old_course.code or c.slug = old_course.slug)
        order by (c.code = old_course.code) desc, c.id
        limit 1;

        if destination_course_id is null then
          update public.courses set major_id = destination_major_id where id = old_course.id;
        else
          update public.resources set course_id = destination_course_id where course_id = old_course.id;
          update public.questions set course_id = destination_course_id where course_id = old_course.id;
          update public.requests set course_id = destination_course_id where course_id = old_course.id;
          delete from public.courses where id = old_course.id;
        end if;
      end loop;
      update public.profiles set major_id = destination_major_id where major_id = old_major.id;
      delete from public.majors where id = old_major.id;
    end if;
  end loop;

  update public.books set college_id = science_id where college_id = legacy_science;
  update public.profiles p
  set college_id = coalesce((select m.college_id from public.majors m where m.id = p.major_id), science_id)
  where p.college_id = legacy_science;
  delete from public.colleges
  where id = legacy_science
    and not exists (select 1 from public.majors where college_id = legacy_science);

  -- Split data from the obsolete combined Engineering/IT record. Matching
  -- official majors win; an unmatched IT-like major moves to IT-AI and any
  -- other unmatched major moves to Engineering. Nothing is dropped blindly.
  for old_major in select * from public.majors where college_id = legacy_engineering_it order by id loop
    destination_major_id := null;
    destination_college_id := null;
    select m.id, m.college_id into destination_major_id, destination_college_id
    from public.majors m
    where m.college_id in (engineering_id, it_id)
      and (m.slug = old_major.slug
        or lower(trim(m.name_ar)) = lower(trim(old_major.name_ar))
        or lower(trim(m.name_en)) = lower(trim(old_major.name_en)))
    order by (m.slug = old_major.slug) desc, m.id
    limit 1;

    if destination_major_id is null then
      destination_college_id := case
        when old_major.name_ar ~ '(حاسوب|حوسبة|معلومات|ذكاء|شبكات|سيبراني|برمجيات)'
          or lower(old_major.name_en) ~ '(computer|information|artificial|network|cyber|software)'
        then it_id else engineering_id end;
      update public.majors set college_id = destination_college_id where id = old_major.id;
    else
      for old_course in select * from public.courses where major_id = old_major.id order by id loop
        destination_course_id := null;
        select c.id into destination_course_id
        from public.courses c
        where c.major_id = destination_major_id
          and (c.code = old_course.code or c.slug = old_course.slug)
        order by (c.code = old_course.code) desc, c.id
        limit 1;

        if destination_course_id is null then
          update public.courses set major_id = destination_major_id where id = old_course.id;
        else
          update public.resources set course_id = destination_course_id where course_id = old_course.id;
          update public.questions set course_id = destination_course_id where course_id = old_course.id;
          update public.requests set course_id = destination_course_id where course_id = old_course.id;
          delete from public.courses where id = old_course.id;
        end if;
      end loop;
      update public.profiles set major_id = destination_major_id where major_id = old_major.id;
      delete from public.majors where id = old_major.id;
    end if;
  end loop;

  update public.profiles p
  set college_id = coalesce((select m.college_id from public.majors m where m.id = p.major_id), engineering_id)
  where p.college_id = legacy_engineering_it;
  update public.books set college_id = engineering_id where college_id = legacy_engineering_it;
  delete from public.colleges
  where id = legacy_engineering_it
    and not exists (select 1 from public.majors where college_id = legacy_engineering_it);
end;
$$;

-- One option per university + exact code, with every faculty using that code
-- attached to the label (needed for faculty-specific English 102 material).
create or replace view public.course_catalog_options
with (security_invoker = true) as
select
  (array_agg(id order by id))[1] as id,
  code,
  (array_agg(name_ar order by id))[1] as name_ar,
  (array_agg(name_en order by id))[1] as name_en,
  (array_agg(slug order by id))[1] as slug,
  (array_agg(major_id order by id))[1] as major_id,
  (array_agg(college_id order by id))[1] as college_id,
  university_id,
  university_slug,
  string_agg(distinct college_name_ar, '، ' order by college_name_ar) as college_names_ar,
  string_agg(distinct college_name_en, ', ' order by college_name_en) as college_names_en
from public.course_catalog_entries
group by university_id, university_slug, code;

revoke all on public.course_catalog_options from public, anon, authenticated;
grant select on public.course_catalog_options to anon, authenticated, service_role;
comment on view public.course_catalog_options is 'Read-only deduplicated catalog; invoker RLS, one option per university/code, with all participating college names.';
notify pgrst, 'reload schema';
commit;
