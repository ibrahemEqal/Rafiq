-- Additive read model only: retain every course ID, foreign key and upload.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create index if not exists idx_courses_code_id on public.courses (code, id);

create or replace view public.course_catalog_entries
with (security_invoker = true) as
select c.id, c.code, c.name_ar, c.name_en, c.slug, c.major_id,
       m.college_id, f.university_id, u.slug as university_slug,
       m.name_ar as major_name_ar, m.name_en as major_name_en, m.slug as major_slug,
       f.name_ar as college_name_ar, f.name_en as college_name_en, f.slug as college_slug
from public.courses c
join public.majors m on m.id = c.major_id
join public.colleges f on f.id = m.college_id
join public.universities u on u.id = f.university_id;

-- Same name does NOT imply same course. Deduplicate by university + exact code.
-- IDs remain deterministic, and old links are resolved through the entries view.
create or replace view public.course_catalog_options
with (security_invoker = true) as
select distinct on (university_id, code)
       id, code, name_ar, name_en, slug, major_id, college_id, university_id, university_slug
from public.course_catalog_entries
order by university_id, code, id;

revoke all on public.course_catalog_entries, public.course_catalog_options from public, anon, authenticated;
grant select on public.course_catalog_entries, public.course_catalog_options to anon, authenticated, service_role;
comment on view public.course_catalog_options is 'Read-only deduplicated catalog; invoker RLS, one existing course per university and code. No course records are deleted or re-parented.';
notify pgrst, 'reload schema';
commit;
