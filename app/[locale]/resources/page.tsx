import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { BookOpen, Building2, ChevronLeft, FolderOpen, GraduationCap, Plus, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import UniversityResources from "@/components/resources/UniversityResources";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourceFilters from "@/components/resources/ResourceFilters";
import { getCatalogPath, getColleges, getCourses, getMajors, searchCourses } from "@/lib/data/catalog";
import { courseSearchTerm } from "@/lib/data/course-search";
import { oneRelation } from "@/lib/data/relations";
import { createPublicClient } from "@/lib/supabase/public";

const uuid = z.uuid();
const resourceTypes = new Set(["summary", "previous_exam", "lecture", "assignment", "notes", "other"]);

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [t, locale, params] = await Promise.all([getTranslations("Resources"), getLocale(), searchParams]);
  const collegeId = uuid.safeParse(params.college).success ? params.college : undefined;
  const majorId = uuid.safeParse(params.major).success ? params.major : undefined;
  const courseId = uuid.safeParse(params.course).success ? params.course : undefined;
  const type = resourceTypes.has(params.type ?? "") ? params.type : undefined;
  const q = params.q?.trim().slice(0, 80) ?? "";
  const courseQuery = courseSearchTerm(params.courseQuery);
  const matchingCourses = await searchCourses(courseQuery);
  const path = await getCatalogPath(collegeId, majorId, courseId);
  const college = path.college;
  const major = path.major;
  const course = path.course;
  const localName = (item: { name_ar: string; name_en: string }) => locale === "ar" ? item.name_ar : item.name_en;

  const colleges = !college ? await getColleges() : [];
  const majors = college && !major ? await getMajors(college.id) : [];
  const courses = major && !course ? await getCourses(major.id) : [];
  const resources = course ? await loadResources(course.id, type, q) : [];

  return <div className="min-h-screen bg-canvas pb-24 pt-8">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-forest px-6 py-10 text-white shadow-sm sm:px-10">
        <div className="absolute -end-24 -top-28 h-72 w-72 rounded-full bg-sage/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-paper/5 px-4 py-2 text-sm font-bold text-mist"><BookOpen size={16} />{t("libraryBadge")}</span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="mt-4 text-lg leading-8 text-mist">{t("catalogSubtitle")}</p>
          </div>
          <Link href="/resources/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sage px-6 py-3.5 font-bold text-ink hover:bg-sage"><Plus size={20} />{t("uploadResource")}</Link>
        </div>
      </section>

      <section aria-labelledby="course-search-heading" className="mb-8 rounded-3xl border border-line bg-paper p-5 sm:p-7">
        <h2 id="course-search-heading" className="text-xl font-bold text-ink">{t("directCourseSearch")}</h2>
        <p className="mb-4 mt-2 text-sm leading-7 text-muted">{t("directCourseSearchHint")}</p>
        <form method="get" className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="course-search" className="sr-only">{t("directCourseSearch")}</label>
          <input id="course-search" name="courseQuery" type="search" minLength={2} maxLength={80} defaultValue={courseQuery} placeholder={t("courseSearchPlaceholder")} className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 focus:outline-forest" />
          <button className="rounded-xl bg-forest px-6 py-3 font-bold text-white">{t("search")}</button>
        </form>
        {courseQuery.length >= 2 && <div className="mt-5">
          <p role="status" className="mb-3 text-sm font-semibold text-muted">{matchingCourses.length ? t("courseSearchLimit") : t("noMatchingCourses")}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {matchingCourses.map(item => {
              const resultMajor = oneRelation(item.majors);
              const resultCollege = oneRelation(resultMajor?.colleges);
              if (!resultMajor || !resultCollege) return null;
              return <li key={item.id}><Link href={`/resources?college=${resultCollege.id}&major=${resultMajor.id}&course=${item.id}`} className="block rounded-2xl border border-line p-4 hover:border-forest hover:bg-sage-soft">
                <span className="block font-bold text-ink">{item.code} — {localName(item)}</span>
                <span className="mt-1 block text-sm leading-6 text-muted">{localName(resultCollege)} / {localName(resultMajor)}</span>
              </Link></li>;
            })}
          </ul>
        </div>}
      </section>

      {!college && <UniversityResources />}

      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-bold text-muted" aria-label={t("catalogPath")}>
        <Link href="/resources" className="rounded-xl bg-paper px-3 py-2 hover:text-forest">{t("colleges")}</Link>
        {college && <><ChevronLeft size={16} /><Link href={`/resources?college=${college.id}`} className="rounded-xl bg-paper px-3 py-2 hover:text-forest">{localName(college)}</Link></>}
        {major && <><ChevronLeft size={16} /><Link href={`/resources?college=${college!.id}&major=${major.id}`} className="rounded-xl bg-paper px-3 py-2 hover:text-forest">{localName(major)}</Link></>}
        {course && <><ChevronLeft size={16} /><span className="rounded-xl bg-sage-soft px-3 py-2 text-forest">{course.code} — {localName(course)}</span></>}
      </nav>

      {!college && <CatalogGrid title={t("chooseCollege")} subtitle={t("chooseCollegeHint")} icon={<Building2 size={24} />}>
        {colleges.map(item => <CatalogLink key={item.id} href={`/resources?college=${item.id}`} title={localName(item)} icon={<Building2 size={23} />} />)}
      </CatalogGrid>}
      {college && !major && <CatalogGrid title={t("chooseMajor")} subtitle={t("chooseMajorHint")} icon={<GraduationCap size={24} />}>
        {majors.map(item => <CatalogLink key={item.id} href={`/resources?college=${college.id}&major=${item.id}`} title={localName(item)} icon={<GraduationCap size={23} />} />)}
      </CatalogGrid>}
      {major && !course && <CatalogGrid title={t("chooseCourse")} subtitle={t("chooseCourseHint")} icon={<FolderOpen size={24} />}>
        {courses.map(item => <CatalogLink key={item.id} href={`/resources?college=${college!.id}&major=${major.id}&course=${item.id}`} title={localName(item)} eyebrow={item.code} icon={<FolderOpen size={23} />} />)}
      </CatalogGrid>}

      {course && <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ResourceFilters selectedType={type} query={q} collegeId={college!.id} majorId={major!.id} courseId={course.id} />
        <main>
          <form method="get" className="relative mb-6">
            <input type="hidden" name="college" value={college!.id} /><input type="hidden" name="major" value={major!.id} /><input type="hidden" name="course" value={course.id} />
            {type && <input type="hidden" name="type" value={type} />}
            <Search className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" size={21} />
            <input name="q" type="search" defaultValue={q} maxLength={80} placeholder={t("searchInsideCourse")} className="w-full rounded-2xl border border-line bg-paper py-4 pe-28 ps-12 outline-none focus:border-forest focus:ring-4 focus:ring-sage-soft" />
            <button className="absolute end-2 top-2 rounded-xl bg-forest px-5 py-2.5 font-bold text-white">{t("search")}</button>
          </form>
          {resources.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{resources.map(item => <ResourceCard key={item.id} resource={item} />)}</div> :
            <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-20 text-center"><FolderOpen size={48} className="mx-auto mb-4 text-mist" /><h2 className="text-xl font-bold text-ink">{t("noCourseResources")}</h2><p className="mx-auto mt-2 max-w-lg text-muted">{t("beFirstUploader")}</p><Link href="/resources/new" className="mt-6 inline-flex rounded-xl bg-forest px-5 py-3 font-bold text-white">{t("uploadResource")}</Link></div>}
        </main>
      </div>}
    </div>
  </div>;
}

async function loadResources(courseId: string, type?: string, q?: string) {
  let query = createPublicClient().from("resources").select(`id, title, type, file_size, download_count, view_count, created_at, courses (name_ar, name_en), profiles!resources_uploader_id_fkey (full_name)`).eq("status", "approved").eq("course_id", courseId);
  if (type) query = query.eq("type", type);
  if (q) query = query.textSearch("search_vector", q, { config: "simple", type: "websearch" });
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
  if (error) throw new Error("Resources could not be loaded");
  return data ?? [];
}

function CatalogGrid({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return <section><div className="mb-6 flex items-center gap-4"><div className="rounded-2xl bg-sage-soft p-3 text-forest">{icon}</div><div><h2 className="text-2xl font-bold text-ink">{title}</h2><p className="mt-1 text-muted">{subtitle}</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div></section>;
}
function CatalogLink({ href, title, eyebrow, icon }: { href: string; title: string; eyebrow?: string; icon: ReactNode }) {
  return <Link href={href} className="group flex min-h-32 items-center gap-4 rounded-3xl border border-line bg-paper p-5 shadow-sm transition hover:-translate-y-1 hover:border-line hover:shadow-sm"><div className="rounded-2xl bg-sage-soft p-3 text-muted group-hover:bg-sage-soft group-hover:text-forest">{icon}</div><div>{eyebrow && <p className="mb-1 text-xs font-bold tracking-wider text-forest">{eyebrow}</p>}<h3 className="font-bold leading-6 text-ink">{title}</h3></div></Link>;
}
