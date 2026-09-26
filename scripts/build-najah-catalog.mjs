import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const base = "https://www.najah.edu";
const arIndex = `${base}/ar/academic/undergraduate-programs/by-faculty/`;
const output = resolve(process.argv[2] ?? "supabase/migrations/20260926020000_seed_najah_catalog.sql");
const faculties = [
  ["كلية الطب البشري والعلوم الطبية المساندة", "Faculty of Medicine and Allied Medical Sciences", "medicine-allied-health"],
  ["كلية تكنولوجيا المعلومات والذكاء الاصطناعي", "Faculty of Information Technology and Artificial Intelligence", "it-ai"],
  ["كلية الطب البيطري والهندسة الزراعية", "Faculty of Veterinary Medicine and Agricultural Engineering", "veterinary-agriculture"],
  ["كلية العلوم الإنسانية والتربوية", "Faculty of Humanities and Educational Sciences", "humanities-education"],
  ["كلية القانون والعلوم السياسية", "Faculty of Law and Political Science", "law-political-science"],
  ["كلية طب وجراحة الفم والاسنان", "Faculty of Dentistry", "dentistry"],
  ["كلية الأعمال والإتصال", "Faculty of Business and Communication", "business-communication"],
  ["كلية الفنون الجميلة", "Faculty of Fine Arts", "fine-arts"], ["كلية الصيدلة", "Faculty of Pharmacy", "pharmacy"],
  ["كلية التمريض", "Faculty of Nursing", "nursing"], ["كلية الهندسة", "Faculty of Engineering", "engineering"],
  ["كلية الشريعة", "Faculty of Sharia", "sharia"], ["كلية العلوم", "Faculty of Science", "science"],
];
const entities = { amp: "&", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—" };
const decode = value => value.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&([a-z]+);/gi, (m, n) => entities[n] ?? m);
const clean = html => decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/[\u200e\u200f\ufeff]/g, "").replace(/\s+/g, " ").trim();
const quote = value => `'${String(value).replaceAll("'", "''")}'`;

async function html(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": "Rafiq academic catalog importer" } });
    if (response.ok) return response.text();
    if (attempt === tries) throw new Error(`${response.status}: ${url}`);
    await new Promise(done => setTimeout(done, attempt * 700));
  }
}
function cards(source, language) {
  const out = new Map();
  const link = /<a\b[^>]*href=["']([^"']*\/academic\/undergraduate-programs\/program\/([^/]+)\/)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of source.matchAll(link)) {
    const body = clean(match[3]);
    if (!(language === "ar" ? body.includes("الدرجة:") : /Degree:/i.test(body))) continue;
    const faculty = faculties.find(pair => body.includes(language === "ar" ? pair[0] : pair[1]));
    if (!faculty) continue;
    const marker = language === "ar" ? faculty[0] : faculty[1];
    out.set(match[2], { slug: match[2], href: new URL(match[1], base).href, name: body.slice(0, body.indexOf(marker)).trim(), faculty });
  }
  return out;
}
function courses(source) {
  const out = new Map();
  for (const table of source.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) for (const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => clean(cell[1]));
    const code = cells[0]?.match(/\b\d{4,12}\b/)?.[0];
    if (code && cells[1] && !out.has(code)) out.set(code, cells[1]);
  }
  return out;
}
async function parallel(items, limit, worker) {
  const out = Array(items.length); let cursor = 0;
  await Promise.all(Array.from({ length: limit }, async () => { while (cursor < items.length) { const i = cursor++; out[i] = await worker(items[i], i); } }));
  return out;
}

const [ar, en] = await Promise.all([html(arIndex), html(arIndex.replace("/ar/", "/en/"))]);
const arPrograms = cards(ar, "ar"); const enPrograms = cards(en, "en");
console.log(`Found ${arPrograms.size} programs in the official catalog.`);
const catalog = await parallel([...arPrograms.values()], 5, async (program, i) => {
  const arPlan = await html(`${program.href}study-plan/`);
  const enPlan = await html(`${program.href.replace("/ar/", "/en/")}study-plan/`).catch(() => "");
  const arCourses = courses(arPlan); const enCourses = courses(enPlan);
  console.log(`[${i + 1}/${arPrograms.size}] ${program.name}: ${arCourses.size}`);
  return { ...program, nameEn: enPrograms.get(program.slug)?.name || program.name, courses: [...arCourses].map(([code, nameAr]) => ({ code, nameAr, nameEn: enCourses.get(code) || nameAr })) };
});

const sql = ["-- Generated from the official An-Najah undergraduate catalog.", `-- Source: ${arIndex}`, "begin;", "insert into public.universities (name_ar,name_en,slug) values ('جامعة النجاح الوطنية','An-Najah National University','an-najah-national-university') on conflict (slug) do update set name_ar=excluded.name_ar,name_en=excluded.name_en;"];
for (const [nameAr, nameEn, slug] of faculties) sql.push(`insert into public.colleges (university_id,name_ar,name_en,slug) select id,${quote(nameAr)},${quote(nameEn)},${quote(slug)} from public.universities where slug='an-najah-national-university' on conflict (university_id,slug) do update set name_ar=excluded.name_ar,name_en=excluded.name_en;`);
for (const program of catalog) {
  const facultySlug = program.faculty[2];
  sql.push(`insert into public.majors (college_id,name_ar,name_en,slug) select c.id,${quote(program.name)},${quote(program.nameEn)},${quote(program.slug)} from public.colleges c join public.universities u on u.id=c.university_id where u.slug='an-najah-national-university' and c.slug=${quote(facultySlug)} on conflict (college_id,slug) do update set name_ar=excluded.name_ar,name_en=excluded.name_en;`);
  for (const item of program.courses) {
    const slug = `${item.code}-${item.nameEn.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course"}`;
    sql.push(`insert into public.courses (major_id,code,name_ar,name_en,slug) select m.id,${quote(item.code)},${quote(item.nameAr)},${quote(item.nameEn)},${quote(slug)} from public.majors m join public.colleges c on c.id=m.college_id join public.universities u on u.id=c.university_id where u.slug='an-najah-national-university' and c.slug=${quote(facultySlug)} and m.slug=${quote(program.slug)} on conflict (major_id,code) do update set name_ar=excluded.name_ar,name_en=excluded.name_en,slug=excluded.slug;`);
  }
}
sql.push("commit;", ""); await mkdir(dirname(output), { recursive: true }); await writeFile(output, sql.join("\n"), "utf8");
console.log(`Created ${output}: ${faculties.length} colleges, ${catalog.length} majors, ${catalog.reduce((n, p) => n + p.courses.length, 0)} course records.`);
