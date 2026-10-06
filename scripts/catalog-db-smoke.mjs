// Isolated PostgreSQL test. Requires @electric-sql/pglite (never a live DB).
// PGLITE_MODULE may point to an externally installed module for CI.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table universities (id uuid primary key, slug text not null);
    create table colleges (id uuid primary key, university_id uuid references universities, name_ar text, name_en text, slug text, unique (university_id,slug));
    create table majors (id uuid primary key, college_id uuid references colleges on delete cascade, name_ar text, name_en text, slug text, unique (college_id,slug));
    create table courses (id uuid primary key, major_id uuid references majors on delete cascade, code text, name_ar text, name_en text, slug text, unique (major_id,code), unique (major_id,slug));
    create table resources (id int primary key, course_id uuid references courses, status text);
    create table questions (id int primary key, course_id uuid references courses);
    create table requests (id int primary key, course_id uuid references courses);
    create table profiles (id uuid primary key, college_id uuid references colleges, major_id uuid references majors);
    create table books (id int primary key, college_id uuid references colleges);
    alter table universities enable row level security;
    alter table colleges enable row level security;
    alter table majors enable row level security;
    alter table courses enable row level security;
    alter table resources enable row level security;
    create policy read_universities on universities for select using (true);
    create policy read_colleges on colleges for select using (true);
    create policy read_majors on majors for select using (true);
    create policy read_courses on courses for select using (code <> 'HIDDEN');
    create policy read_resources on resources for select using (status = 'approved');
    grant select on universities, colleges, majors, courses, resources, questions, requests, profiles, books to anon, authenticated;
    insert into universities values ('00000000-0000-0000-0000-000000000001','an-najah-national-university'),('00000000-0000-0000-0000-000000000002','another-university');
    insert into colleges select id,id,'كلية','College','college' from universities;
    insert into colleges values
      ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000001','كلية العلوم','Faculty of Science','science'),
      ('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000001','كلية الهندسة','Faculty of Engineering','engineering'),
      ('10000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000001','كلية تكنولوجيا المعلومات','Faculty of Information Technology','it-ai'),
      ('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','كلية العلوم','Faculty of Science','legacy-science'),
      ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','كلية الهندسة وتكنولوجيا المعلومات','Faculty of Engineering and IT','legacy-engineering-it');
    insert into majors select id,id,'تخصص','Major','major' from colleges;
    insert into majors values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','آخر','Another Major','another-major');
    insert into majors values
      ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','الرياضيات','Mathematics','mathematics'),
      ('20000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000102','الرياضيات','Mathematics','mathematics'),
      ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','علم الحاسوب','Computer Science','computer-science'),
      ('20000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000101','علم الحاسوب','Computer Science','computer-science');
    insert into courses values
      ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','11000102','لغة عربية','Arabic','arabic'),
      ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','11000102','لغة عربية','Arabic','arabic'),
      ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','11000102','لغة عربية','Arabic','arabic'),
      ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','11000322','إنجليزي 2','English II','en2'),
      ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000003','11000323','إنجليزي 2','English II','en2'),
      ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','HIDDEN','محجوب','Hidden','hidden'),
      ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10211101','تفاضل وتكامل 1','Calculus I','calculus-1'),
      ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10211101','تفاضل وتكامل 1','Calculus I','calculus-1'),
      ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','10671101','مقدمة حاسوب','Computer Introduction','computer-introduction'),
      ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','10671212','خوارزميات','Algorithms','algorithms'),
      ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000003','11000322','إنجليزي 2','English II','english-2');
    insert into resources values (1,'00000000-0000-0000-0000-000000000001','approved'),(2,'00000000-0000-0000-0000-000000000002','approved'),(3,'00000000-0000-0000-0000-000000000002','pending'),(4,'00000000-0000-0000-0000-000000000003','approved'),(5,'30000000-0000-4000-8000-000000000002','approved');
    insert into questions values (1,'30000000-0000-4000-8000-000000000002');
    insert into requests values (1,'30000000-0000-4000-8000-000000000002');
    insert into profiles values
      ('40000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000102','20000000-0000-4000-8000-000000000002'),
      ('40000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000101','20000000-0000-4000-8000-000000000004');
    insert into books values (1,'00000000-0000-0000-0000-000000000102'),(2,'00000000-0000-0000-0000-000000000101');
  `);
  const migration = await readFile(new URL('../supabase/migrations/20260928210000_shared_course_catalog.sql', import.meta.url), 'utf8');
  const cleanup = await readFile(new URL('../supabase/migrations/20260929150000_normalize_catalog_colleges_and_labels.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration); // Safe to re-run in isolation.
  await db.exec(cleanup);
  await db.exec(cleanup); // Cleanup and view replacement are idempotent.
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    const { rows } = await db.query(`select id, university_slug, code from course_catalog_options where code in ('11000102','11000322','11000323') order by university_slug, code`);
    assert.equal(rows.length, 4, 'One Arabic entry per university, two distinct English codes, and no hidden row');
    assert.equal(rows.filter(row => row.code === '11000102').length, 2);
    const english = await db.query(`select college_names_ar from course_catalog_options where university_slug='an-najah-national-university' and code='11000322'`);
    assert.match(english.rows[0].college_names_ar, /كلية تكنولوجيا المعلومات/);
    const shared = await db.query(`select r.id from resources r join course_catalog_entries c on c.id=r.course_id where c.code='11000102' and c.university_slug='an-najah-national-university' order by r.id`);
    assert.deepEqual(shared.rows.map(row => row.id), [1, 2], 'Keep both majors, exclude pending files and other universities');
    await assert.rejects(db.exec(`delete from course_catalog_entries where code='11000102'`));
    await db.exec('reset role');
  }
  assert.equal((await db.query(`select count(*)::int as n from colleges where id in ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000102')`)).rows[0].n, 0);
  assert.equal((await db.query('select count(*)::int as n from resources')).rows[0].n, 5);
  assert.equal((await db.query(`select course_id from resources where id=5`)).rows[0].course_id, '30000000-0000-4000-8000-000000000001');
  assert.equal((await db.query(`select course_id from questions where id=1`)).rows[0].course_id, '30000000-0000-4000-8000-000000000001');
  assert.equal((await db.query(`select course_id from requests where id=1`)).rows[0].course_id, '30000000-0000-4000-8000-000000000001');
  assert.equal((await db.query(`select college_id from books where id=1`)).rows[0].college_id, '10000000-0000-4000-8000-000000000001');
  assert.equal((await db.query(`select college_id from books where id=2`)).rows[0].college_id, '10000000-0000-4000-8000-000000000002');
  console.log('PASS: catalog views, faculty labels, targeted legacy-college merge, invoker RLS and linked data retention');
} finally { await db.close(); }
