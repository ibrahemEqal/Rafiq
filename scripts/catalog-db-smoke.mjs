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
    create table colleges (id uuid primary key, university_id uuid references universities, name_ar text, name_en text, slug text);
    create table majors (id uuid primary key, college_id uuid references colleges, name_ar text, name_en text, slug text);
    create table courses (id uuid primary key, major_id uuid references majors, code text, name_ar text, name_en text, slug text);
    create table resources (id int primary key, course_id uuid references courses, status text);
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
    grant select on universities, colleges, majors, courses, resources to anon, authenticated;
    insert into universities values ('00000000-0000-0000-0000-000000000001','an-najah-national-university'),('00000000-0000-0000-0000-000000000002','another-university');
    insert into colleges select id,id,'كلية','College','college' from universities;
    insert into majors select id,id,'تخصص','Major','major' from colleges;
    insert into majors values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','آخر','Another Major','another-major');
    insert into courses values
      ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','11000102','لغة عربية','Arabic','arabic'),
      ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','11000102','لغة عربية','Arabic','arabic'),
      ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','11000102','لغة عربية','Arabic','arabic'),
      ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','11000322','إنجليزي 2','English II','en2'),
      ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000003','11000323','إنجليزي 2','English II','en2'),
      ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','HIDDEN','محجوب','Hidden','hidden');
    insert into resources values (1,'00000000-0000-0000-0000-000000000001','approved'),(2,'00000000-0000-0000-0000-000000000002','approved'),(3,'00000000-0000-0000-0000-000000000002','pending'),(4,'00000000-0000-0000-0000-000000000003','approved');
  `);
  const migration = await readFile(new URL('../supabase/migrations/20260928210000_shared_course_catalog.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration); // Safe to re-run in isolation.
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    const { rows } = await db.query('select id, university_slug, code from course_catalog_options order by university_slug, code');
    assert.equal(rows.length, 4, 'One Arabic entry per university, two distinct English codes, and no hidden row');
    assert.equal(rows.filter(row => row.code === '11000102').length, 2);
    const shared = await db.query(`select r.id from resources r join course_catalog_entries c on c.id=r.course_id where c.code='11000102' and c.university_slug='an-najah-national-university' order by r.id`);
    assert.deepEqual(shared.rows.map(row => row.id), [1, 2], 'Keep both majors, exclude pending files and other universities');
    await assert.rejects(db.exec(`delete from course_catalog_entries where code='11000102'`));
    await db.exec('reset role');
  }
  assert.equal((await db.query('select count(*)::int as n from courses')).rows[0].n, 6);
  assert.equal((await db.query('select count(*)::int as n from resources')).rows[0].n, 4);
  console.log('PASS: PostgreSQL migration, same-code deduplication, different-code/university isolation, invoker RLS, no deletions, original foreign keys and uploads retained');
} finally { await db.close(); }
