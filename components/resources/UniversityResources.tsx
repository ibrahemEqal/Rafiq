"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BookOpen, ExternalLink, Search } from "lucide-react";
import courses from "@/data/university-resources.json";

const typeNames: Record<string, [string, string]> = {
  previous_exam: ["امتحانات وكويزات", "Exams and quizzes"],
  summary: ["تلاخيص", "Summaries"],
  lecture: ["محاضرات وسلايدات", "Lectures and slides"],
  notes: ["ملاحظات", "Notes"],
  other: ["كتب وموارد أخرى", "Books and other resources"],
};

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u064b-\u065f\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").toLowerCase();
}

function sourceName(value: string) {
  const host = new URL(value).hostname;
  if (host === "www.youtube.com") return "YouTube";
  if (host === "docs.google.com") return "Google Docs";
  if (host === "masaaq.net") return "Masaaq";
  return "Google Drive";
}

export default function UniversityResources() {
  const ar = useLocale() === "ar";
  const [query, setQuery] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [type, setType] = useState("");
  const term = normalize(query.trim());
  const filtered = courses
    .filter(course => !courseSlug || course.slug === courseSlug)
    .map(course => ({ ...course, resources: course.resources.filter(resource =>
      (!type || resource.type === type) &&
      (!term || normalize(`${course.name_ar} ${course.name_en} ${resource.title} ${sourceName(resource.url)}`).includes(term))
    ) }))
    .filter(course => course.resources.length);
  const count = filtered.reduce((total, course) => total + course.resources.length, 0);
  const searching = Boolean(term || courseSlug || type);

  return <section aria-labelledby="university-resources-title" className="mb-10 rounded-3xl border border-line bg-paper p-5 shadow-sm sm:p-8">
    <div className="mb-6 flex items-start gap-4">
      <span className="rounded-2xl bg-sage-soft p-3 text-forest"><BookOpen size={24} /></span>
      <div>
        <h2 id="university-resources-title" className="text-2xl font-bold text-ink">{ar ? "متطلبات الجامعة — جامعة النجاح" : "University requirements — An-Najah"}</h2>
        <p className="mt-2 leading-7 text-muted">{ar ? "كتب وتلاخيص وامتحانات ومحاضرات لست مواد. اختر المادة لعرض مواردها، ثم افتح الرابط الأصلي." : "Books, summaries, exams and lectures for six courses. Expand a course, then open the original link."}</p>
      </div>
    </div>
    <div className="mb-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
      <label className="relative">
        <span className="sr-only">{ar ? "ابحث في متطلبات الجامعة" : "Search university resources"}</span>
        <Search size={19} className="pointer-events-none absolute start-3 top-3.5 text-muted" />
        <input type="search" value={query} maxLength={120} onChange={event => setQuery(event.target.value)} placeholder={ar ? "ابحث باسم المادة أو المورد…" : "Search by course or resource…"} className="w-full rounded-xl border border-line py-3 pe-3 ps-10 focus:outline-forest" />
      </label>
      <label>
        <span className="sr-only">{ar ? "المادة" : "Course"}</span>
        <select value={courseSlug} onChange={event => setCourseSlug(event.target.value)} className="w-full rounded-xl border border-line bg-paper p-3 focus:outline-forest">
          <option value="">{ar ? "كل المواد" : "All courses"}</option>
          {courses.map(course => <option key={course.slug} value={course.slug}>{ar ? course.name_ar : course.name_en}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">{ar ? "نوع المورد" : "Resource type"}</span>
        <select value={type} onChange={event => setType(event.target.value)} className="w-full rounded-xl border border-line bg-paper p-3 focus:outline-forest">
          <option value="">{ar ? "كل الأنواع" : "All types"}</option>
          {Object.entries(typeNames).map(([value, names]) => <option key={value} value={value}>{names[ar ? 0 : 1]}</option>)}
        </select>
      </label>
    </div>
    <p role="status" className="mb-4 text-sm font-bold text-forest">{ar ? `${count} مورد` : `${count} resources`}</p>
    <div className="grid items-start gap-4 lg:grid-cols-2">
      {filtered.map(course => <details key={`${course.slug}-${searching}`} open={searching || undefined} className="rounded-2xl border border-line bg-canvas p-4">
        <summary className="cursor-pointer rounded-lg text-lg font-bold text-ink focus-visible:outline-2 focus-visible:outline-forest">
          {ar ? course.name_ar : course.name_en}<span className="ms-2 text-sm font-medium text-forest">({course.resources.length})</span>
        </summary>
        <ul className="mt-4 space-y-2">
          {course.resources.map(resource => <li key={resource.url}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper p-3 transition hover:border-forest hover:bg-sage-soft focus-visible:outline-2 focus-visible:outline-forest">
              <span><span dir="auto" className="block font-semibold leading-7 text-ink">{resource.title}</span><span className="text-xs text-muted">{typeNames[resource.type][ar ? 0 : 1]} · {sourceName(resource.url)}</span><span className="sr-only"> — {ar ? "يفتح في نافذة جديدة" : "opens in a new tab"}</span></span>
              <ExternalLink aria-hidden="true" size={17} className="shrink-0 text-forest" />
            </a>
          </li>)}
        </ul>
      </details>)}
    </div>
    {!count && <p className="rounded-xl bg-canvas p-6 text-center text-muted">{ar ? "لا توجد نتائج مطابقة. جرّب كلمة أخرى أو غيّر الفلاتر." : "No matching resources. Try another search or change the filters."}</p>}
    <p className="mt-5 text-xs leading-6 text-muted">{ar ? "روابط خارجية؛ إتاحة الملفات وصلاحيات عرضها يتحكم بها أصحابها." : "External links; file availability and viewing permissions are controlled by their owners."}</p>
  </section>;
}
