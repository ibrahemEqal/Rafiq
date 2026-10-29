begin;


-- Bring the formerly file-backed university links into the same admin editor.
create table public.curated_resources (
 id uuid primary key default gen_random_uuid(), course_slug text not null,
 course_name_ar text not null, course_name_en text not null,
 title text not null check (char_length(btrim(title)) between 3 and 160),
 type public.resource_type not null, url text not null
 check (url ~ '^https://(drive\.google\.com|docs\.google\.com|www\.youtube\.com|masaaq\.net)/'),
 created_at timestamptz not null default now(),
 unique(course_slug,url)
);
alter table public.curated_resources enable row level security;
revoke all on public.curated_resources from public,anon,authenticated;
grant select on public.curated_resources to anon,authenticated;
create policy "curated links public read" on public.curated_resources for select to anon,authenticated using(true);
insert into public.curated_resources(course_slug,course_name_ar,course_name_en,title,type,url)
select x.course_slug,x.course_name_ar,x.course_name_en,x.title,x.type::public.resource_type,x.url
from jsonb_to_recordset($curated$[{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"فاينل الكتروني","type":"previous_exam","url":"https://drive.google.com/file/d/1oI86EYWzP4PJ9CKJ_PEqapuTWoT1I-8D/view"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"الكتاب","type":"other","url":"https://drive.google.com/file/d/175vlVDwd_IEWXCQFTFn8VYW9zlFu4PFL/view"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"تلخيص د.معتصم غادرة +كويز","type":"summary","url":"https://drive.google.com/drive/folders/194Ak5bpJ2MUBxiZ_WxxWfYIXWRI_cxrH"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"فاينل","type":"previous_exam","url":"https://drive.google.com/file/d/1Fx2do-slA5crTSLCG-GrHb1sVTNsxFZZ/view"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"امتحان سكند","type":"previous_exam","url":"https://drive.google.com/file/d/1_QlyR_WHeW8v4gipVYOk2afiuvjYw0a-/view"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"تجميع امتحانات","type":"previous_exam","url":"https://drive.google.com/drive/folders/1FMb9RKcw1mghV8G1_xGspPk8DBg-yyxO"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"امتحان فيرست","type":"previous_exam","url":"https://drive.google.com/file/d/1Oab9HIcTflrEMAfF4vo9_zuUUWj7iB5D/view"},{"course_slug":"arabic","course_name_ar":"اللغة العربية","course_name_en":"Arabic Language","title":"محاضرات د.معتصم","type":"lecture","url":"https://www.youtube.com/watch?v=9onebOR5gak&list=PLlqAM5pwrB09Ri3gwPScYRWUXKs-Kn9it"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"تلخيص المادة","type":"summary","url":"https://drive.google.com/drive/folders/1mXu60MVnScnVvdkiQU13O9owpXmR36zT"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"امتحانات فاينل","type":"previous_exam","url":"https://drive.google.com/drive/folders/17Nt_PC6ggVyZ0TLjKyLRX-8SFvpZfPDH"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"حلول الكتاب","type":"other","url":"https://drive.google.com/drive/folders/11gW8TmEyJy53CBX3y9tWatVZFz394vqd"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"كويز الوحدة ٢","type":"previous_exam","url":"https://drive.google.com/file/d/1F8pDtGYFqAd_nsTc6Vmah-GsWQI9Dkyh/view"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"كويز الوحدة ٤","type":"previous_exam","url":"https://drive.google.com/file/d/1nDhtAuW6OBgleEgY0XljlnUhwJ0k6m9y/view"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"ميد ٢٠٢٤","type":"previous_exam","url":"https://drive.google.com/file/d/1xuWwXmEc40MX4mqv6zb4QFEllYnH1u35/view"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"حلول الكتاب","type":"other","url":"https://drive.google.com/file/d/1ZHZjoyXOyrRHCKQ6e4xt-1ExSKrv2MQd/view"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"تلخيص القواعد","type":"summary","url":"https://drive.google.com/drive/folders/1kexys8-MNi4Y4qMTxDJ8WbIyMd9LW03c"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"محاضرات د.منذر","type":"lecture","url":"https://www.youtube.com/playlist?list=PLaRo3tFB7KrbkFkqXkG8XwSSUS4d0Ghmz"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"ميد","type":"previous_exam","url":"https://masaaq.net/redirect?id=sb8k9fjszdNOVLyjHJIu&t=%D9%85%D9%8A%D8%AF%D8%AA%D9%8A%D8%B1%D9%85"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"كويز unit 1+2","type":"previous_exam","url":"https://drive.google.com/drive/folders/1n6d7VXZsUzAk47hvrDWsVj46E2L6hFhH"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"تلخيص مادة الفاينل","type":"summary","url":"https://masaaq.net/redirect?id=6zcV0YCPBiaR6UZ3p3O4&t=%D8%AA%D9%84%D8%AE%D9%8A%D8%B5+%D9%85%D8%A7%D8%AF%D8%A9+%D8%A7%D9%84%D9%81%D8%A7%D9%8A%D9%86%D9%84+-+%D9%8A%D9%86%D8%A7%D9%84+%D8%AE%D8%B1%D9%88%D8%A8"},{"course_slug":"english-101","course_name_ar":"إنجليزي 101","course_name_en":"English 101","title":"الكتاب","type":"other","url":"https://drive.google.com/drive/folders/1zI4Z0zmfBhVV149dYlzBIA052GgIumPd"},{"course_slug":"remedial-english","course_name_ar":"استدراكي","course_name_en":"Remedial English","title":"حل الكتاب / الكتاب","type":"other","url":"https://drive.google.com/file/d/1SBdPFArjNX1WeD_yZ_tRokNSHXwORged/view"},{"course_slug":"remedial-english","course_name_ar":"استدراكي","course_name_en":"Remedial English","title":"تلخيص","type":"summary","url":"https://drive.google.com/file/d/1XndVQgp49gUYku31kb1oLmpDQRqSaxNz/view"},{"course_slug":"remedial-english","course_name_ar":"استدراكي","course_name_en":"Remedial English","title":"تلخيص المعاني","type":"summary","url":"https://drive.google.com/file/d/1VDmH9u2okOmqVW9LrcN22HeV7hzSy1lr/view"},{"course_slug":"remedial-english","course_name_ar":"استدراكي","course_name_en":"Remedial English","title":"تلخيص المادة د.تسنيم عقل","type":"summary","url":"https://drive.google.com/file/d/1hCrFqz96G_qf13_kS0Cv10tx7pX7ayCS/view"},{"course_slug":"remedial-english","course_name_ar":"استدراكي","course_name_en":"Remedial English","title":"سنوات امتحان المستوى","type":"previous_exam","url":"https://drive.google.com/drive/folders/14Tcpw9Yevw3ZWTqNiQxKey1U1g_3xXod"},{"course_slug":"remedial-english","course_name_ar":"استدراكي","course_name_en":"Remedial English","title":"ميد","type":"previous_exam","url":"https://drive.google.com/drive/folders/1UmNfmwlrmuLge2tbFMoHt3b2Wk9kXPxV"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"ميد 2025","type":"previous_exam","url":"https://drive.google.com/file/d/1mL203Po1e4_33rsKuC-ADy6zB6xj0OA3/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"تلخيص د.عبدالرحمن شوبكي","type":"summary","url":"https://drive.google.com/drive/folders/1wyEpVkZNESgbjH3lCthdMPT6y6owim3F"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"كويز","type":"previous_exam","url":"https://drive.google.com/file/d/1CvNrJw0KzeCT7fpOVKvmXmfjTI9dtzIY/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"ميد","type":"previous_exam","url":"https://drive.google.com/file/d/11xk4ShVSDRL2ga-4ONzGfu3udlUYGuvd/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"امتحان سنوات","type":"previous_exam","url":"https://drive.google.com/file/d/1FpUzdRMi3MuJikT0Qs7EnZlS8wGQ_k7p/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"فاينل الكتروني","type":"previous_exam","url":"https://drive.google.com/file/d/1VQYy8wmFdd9iNCb8Ilh65OS7OCJqdbgT/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"فاينل","type":"previous_exam","url":"https://drive.google.com/file/d/1Vm-EJJJ0uVQK98uxqQBp-8LKOlNTb6Xw/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"سكند","type":"previous_exam","url":"https://drive.google.com/file/d/1ppZGJKWxuAvL39hP5BgSGvJoJp5u4PEz/view"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"الكتاب","type":"other","url":"https://drive.google.com/drive/folders/15HrNp9WmkNDsyQ6MeiT2r5fn6oMt8rw6"},{"course_slug":"palestinian-studies","course_name_ar":"دراسات فلسطينية","course_name_en":"Palestinian Studies","title":"تلخيص مادة الفاينل","type":"summary","url":"https://drive.google.com/drive/folders/1Ae57DVArDXPNx2elQPW1sOqpyah37Z2E"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"تجميع امتحانات سكند","type":"previous_exam","url":"https://drive.google.com/drive/folders/1NaLzWEGSQciPxxQKyv99ytTRMOnB2Z5j"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"فاينل","type":"previous_exam","url":"https://drive.google.com/file/d/1QE6O2uK5RjSJO7d_8C5tIDA2IN_hpOlU/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"سنوات فاينل","type":"previous_exam","url":"https://drive.google.com/file/d/17n5LCpbsSh5fuybLmZXjD-MuZiojQM6S/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"الكتاب","type":"other","url":"https://drive.google.com/file/d/1eN_YO7WkPPWezis2y551ilxoD8iPDRcH/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"تلخيص شامل / تلخيص","type":"summary","url":"https://drive.google.com/drive/folders/1Ufp_wrZt6bFVXPg_CJ0zQ6ncLg3tvRmG"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"ميد","type":"previous_exam","url":"https://drive.google.com/file/d/1Dl7jzQYoOow8ZVJXBkicBTjqqAZQK0Nd/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"تلخيص مادة الميد","type":"summary","url":"https://drive.google.com/file/d/1PAyZ94pH7d40Tao_rbhxLG8meBhuUrqB/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"فاينل","type":"previous_exam","url":"https://drive.google.com/file/d/1xgIPfksT3Tem6g-9XsC8s2XtmC3-GYYF/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"فاينل ٢","type":"previous_exam","url":"https://drive.google.com/file/d/18P3m-1aC0DBL0MKKizzSF3I2kmfmOwMK/view"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"فيرست","type":"previous_exam","url":"https://drive.google.com/drive/folders/14aY3n0WKgnJhWHLha2fphMG_RANsu87K"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"سكند","type":"previous_exam","url":"https://drive.google.com/drive/folders/1NVdg3Fd4QSEgsmSYWiRlIl1v9963OW7x"},{"course_slug":"islamic-culture","course_name_ar":"ثقافة اسلامية","course_name_en":"Islamic Culture","title":"فاينل ٣","type":"previous_exam","url":"https://drive.google.com/drive/folders/1EWzyZ_gBgSRHPNH4ALucu8LYdJZYA2Dv"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلخيص مادة الميد","type":"summary","url":"https://drive.google.com/file/d/1vFxodnxMKqmfWEP9g-evEe0uje3bZRPN/view"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلخيص مادة الفاينل","type":"summary","url":"https://drive.google.com/file/d/1xN4KzGMeDKN3jxJSJdzV7AaCUZAH0Nw3/view"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تجميع امتحانات","type":"previous_exam","url":"https://drive.google.com/file/d/1pyBgqJMUmBSCVrp9XTsz6PyxocZcOgGG/view"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"شرح اكسل","type":"lecture","url":"https://drive.google.com/drive/folders/1jhwj4HlRLaBdKD0fVaVyjcqaU-S8l0O1"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلخيص شامل","type":"summary","url":"https://drive.google.com/file/d/1iSNm5ftDFt2BdbgRACEJgeRdYpYVmD31/view"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"امتحان اكسل عملي","type":"previous_exam","url":"https://docs.google.com/spreadsheets/d/1T1Qhun51GO-uPxqPrutapUzxFc_YLqvr/edit?rtpof=true&sd=true&pli=1&gid=1265098078#gid=1265098078"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلخيص بوربوينت","type":"summary","url":"https://drive.google.com/drive/folders/1fMLugatII9_fTtnxR-eT3caok5JgF_Vp"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلخيص وورد","type":"summary","url":"https://drive.google.com/drive/folders/1-k6raJmIzVQ5zVqktI5gLg4REefjJgNg"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلخيص اكسل","type":"summary","url":"https://drive.google.com/drive/folders/1fWyoEr8r0B_SC1oteLm2E5xg9SFv69Aw"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"تلاخيص","type":"summary","url":"https://drive.google.com/drive/folders/1k75d8LT0CATJPmYERPqXMkqKm_kKJBY7"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"سلايدات.","type":"lecture","url":"https://drive.google.com/file/d/1vpGF_KGbxAwXkk8MCSpF9XYtwuiYf9EB/view"},{"course_slug":"computer-skills","course_name_ar":"علم ومهارات الحاسوب","course_name_en":"Computer Science and Skills","title":"عملي وورد","type":"other","url":"https://drive.google.com/file/d/177spJOZQPdw4RJPchEgcoU2ZLWYdbzmE/view"}]$curated$::jsonb)
as x(course_slug text,course_name_ar text,course_name_en text,title text,type text,url text);

-- The editor is deliberately limited to public content, catalog metadata and
-- account profiles. No private study sets, companion notes or credentials.
create table public.admin_content_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  entity text not null,
  action text not null check (action in ('update','delete','approve_all')),
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_content_audit enable row level security;
revoke all on public.admin_content_audit from public, anon, authenticated;
grant select on public.admin_content_audit to authenticated;
create policy "admins read audit" on public.admin_content_audit for select to authenticated
using (public.is_admin(auth.uid()));

create function public.admin_content_fields(entity text) returns text[]
language sql immutable set search_path = pg_catalog as $$
 select case entity
 when 'curated_resources' then array['title','type','url','course_name_ar','course_name_en']
 when 'resources' then array['title','description','type','course_id','external_url']
 when 'books' then array['title','description','type','status','whatsapp_number']
 when 'requests' then array['title','description','type','status','course_id']
 when 'questions' then array['title','body','course_id']
 when 'answers' then array['body']
 when 'answer_comments' then array['body']
 when 'request_responses' then array['body','whatsapp_number']
 when 'campus_circles' then array['title','description','location','kind','status']
 when 'profiles' then array['full_name','username','role']
 when 'universities' then array['name_ar','name_en','slug']
 when 'colleges' then array['name_ar','name_en','slug']
 when 'majors' then array['name_ar','name_en','slug']
 when 'courses' then array['name_ar','name_en','code','description_ar','description_en']
 else null end;
$$;
revoke all on function public.admin_content_fields(text) from public, anon;
grant execute on function public.admin_content_fields(text) to authenticated;

create function public.admin_content_list(entity text, query text default '', page_number integer default 1)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare fields text[]; search_column text; rows_json jsonb; total bigint;
begin
 if auth.uid() is null or not coalesce(public.is_admin(auth.uid()),false) then
  raise exception using errcode='42501', message='admin_required';
 end if;
 fields := public.admin_content_fields(entity);
 if fields is null or char_length(coalesce(query,'')) > 100 or page_number not between 1 and 100000 then
  raise exception using errcode='22023',message='invalid_admin_input';
 end if;
 search_column := case when entity='profiles' then 'full_name'
 when entity in ('answers','answer_comments','request_responses') then 'body'
 when entity in ('universities','colleges','majors','courses') then 'name_ar' else 'title' end;
 execute format('select count(*) from public.%I t where strpos(lower(coalesce(t.%I,'''')),lower($1))>0',entity,search_column)
 into total using coalesce(query,'');
 execute format($q$
 select coalesce(jsonb_agg(item),'[]'::jsonb) from (
  select jsonb_build_object('id',t.id,'version',md5(to_jsonb(t)::text),'values',
   (select jsonb_object_agg(key,value) from jsonb_each(to_jsonb(t)) where key=any($3)) ||
   jsonb_build_object('status',to_jsonb(t)->'status','source_type',to_jsonb(t)->'source_type',
     '_course_name_ar',(select c.name_ar from public.courses c where c.id=(to_jsonb(t)->>'course_id')::uuid),
     '_course_name_en',(select c.name_en from public.courses c where c.id=(to_jsonb(t)->>'course_id')::uuid))) as item
  from public.%I t where strpos(lower(coalesce(t.%I,'')),lower($1))>0
  order by t.created_at desc,t.id limit 20 offset $2
 ) x$q$,entity,search_column)
 into rows_json using coalesce(query,''),(page_number-1)*20,fields;
 return jsonb_build_object('rows',rows_json,'total',total);
end;
$$;
revoke all on function public.admin_content_list(text,text,integer) from public, anon;
grant execute on function public.admin_content_list(text,text,integer) to authenticated;

create function public.admin_content_mutate(entity text, target_id uuid, expected_version text, operation text, patch jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog, public as $$
declare fields text[]; before_row jsonb; after_row jsonb; columns_sql text; actor uuid:=auth.uid();
begin
 if actor is null or not coalesce(public.is_admin(actor),false) then
  raise exception using errcode='42501',message='admin_required';
 end if;
 fields:=public.admin_content_fields(entity);
 if fields is null or target_id is null or operation not in ('update','delete') or
 expected_version is null or jsonb_typeof(patch) is distinct from 'object' then
  raise exception using errcode='22023',message='invalid_admin_input';
 end if;
 -- This serializes role changes so concurrent demotions cannot remove every admin.
 if entity='profiles' then perform pg_advisory_xact_lock(891294117); end if;
 execute format('select to_jsonb(t) from public.%I t where id=$1 for update',entity)
 into before_row using target_id;
 if before_row is null or md5(before_row::text)<>expected_version then
  raise exception using errcode='40001',message='admin_conflict';
 end if;
 if entity='profiles' and (operation='delete' or patch ? 'role') then
  if target_id=actor then raise exception using errcode='22023',message='cannot_change_own_access'; end if;
  if before_row->>'role'='admin' and (operation='delete' or patch->>'role' is distinct from 'admin')
   and (select count(*) from public.profiles where role='admin')<=1 then
   raise exception using errcode='22023',message='last_admin';
  end if;
 end if;
 if operation='update' then
  if patch='{}'::jsonb or exists(select 1 from jsonb_object_keys(patch) key where not(key=any(fields))) or
   exists(select 1 from jsonb_each(patch) where jsonb_typeof(value) not in ('string','null') or char_length(value#>>'{}')>8000) then
   raise exception using errcode='22023',message='invalid_admin_fields';
  end if;
  if entity='resources' and patch ? 'title' and char_length(btrim(patch->>'title')) not between 3 and 160 then
   raise exception using errcode='22023',message='invalid_resource_title';
  end if;
  if entity='resources' and patch ? 'external_url' then
   if before_row->>'source_type'<>'external' or (patch->>'external_url') is null or
     (patch->>'external_url') !~ '^https://(drive|docs)\.google\.com/' then
    raise exception using errcode='22023',message='invalid_resource_link';
   end if;
  end if;
  if entity='profiles' and patch ? 'role' and (patch->>'role') not in ('student','admin') then
   raise exception using errcode='22023',message='invalid_role';
  end if;
  select string_agg(format('%I',key),',' order by key) into columns_sql from jsonb_object_keys(patch) key;
  execute format('update public.%I t set (%s)=(select %s from jsonb_populate_record(null::public.%I,$1)) where t.id=$2 returning to_jsonb(t)',
   entity,columns_sql,columns_sql,entity)
  into after_row using patch,target_id;
  if entity='curated_resources' and (patch ? 'course_name_ar' or patch ? 'course_name_en') then
   update public.curated_resources set
    course_name_ar=case when patch ? 'course_name_ar' then patch->>'course_name_ar' else course_name_ar end,
    course_name_en=case when patch ? 'course_name_en' then patch->>'course_name_en' else course_name_en end
   where course_slug=before_row->>'course_slug';
  end if;
 else
  -- Catalog parents must be empty before deletion: never cascade a college/major
  -- deletion across thousands of courses/resources through this UI.
  if entity='universities' and exists(select 1 from public.colleges where university_id=target_id) or
     entity='colleges' and exists(select 1 from public.majors where college_id=target_id) or
     entity='majors' and exists(select 1 from public.courses where major_id=target_id) or
     entity='courses' and (exists(select 1 from public.resources where course_id=target_id) or
       exists(select 1 from public.questions where course_id=target_id) or exists(select 1 from public.requests where course_id=target_id)) then
    raise exception using errcode='23503',message='admin_has_children';
  end if;
  if entity='profiles' then
   -- Delete the Auth account, not just its public profile. Foreign keys may
   -- block the operation if dependent content needs to be handled first.
   delete from auth.users where id=target_id;
   if not found then raise exception using errcode='40001',message='admin_conflict'; end if;
  else
   execute format('delete from public.%I where id=$1',entity) using target_id;
  end if;
 end if;
 insert into public.admin_content_audit(actor_id,entity,action,target_id,details)
 values(actor,entity,operation,target_id,jsonb_build_object('before',before_row,'after',after_row));
 return jsonb_build_object('success',true);
end;
$$;
revoke all on function public.admin_content_mutate(text,uuid,text,text,jsonb) from public, anon;
grant execute on function public.admin_content_mutate(text,uuid,text,text,jsonb) to authenticated;

-- One DB transaction approves every pending row, not just the current 20-row page.
create function public.admin_approve_pending_resources() returns integer
language plpgsql security definer set search_path=pg_catalog, public as $$
declare affected integer;
begin
 if auth.uid() is null or not coalesce(public.is_admin(auth.uid()),false) then
  raise exception using errcode='42501',message='admin_required';
 end if;
 update public.resources set status='approved' where status='pending';
 get diagnostics affected=row_count;
 insert into public.admin_content_audit(actor_id,entity,action,details)
 values(auth.uid(),'resources','approve_all',jsonb_build_object('count',affected));
 return affected;
end;
$$;
revoke all on function public.admin_approve_pending_resources() from public, anon;
grant execute on function public.admin_approve_pending_resources() to authenticated;
commit;
