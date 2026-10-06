import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { BookOpen, Building2, ChevronLeft, FolderOpen, GraduationCap, Plus, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourceFilters from "@/components/resources/ResourceFilters";
import { getCatalogPath, getColleges, getCourses, getMajors, getUniversityCourses, getCourseSelection, getEquivalentCourseIds } from "@/lib/data/catalog";
import { getUniversityRequirement, universityRequirements } from "@/lib/catalog/university-requirements";
import { createPublicClient } from "@/lib/supabase/public";

const uuid = z.guid();
const resourceTypes = new Set(["summary", "previous_exam", "lecture", "assignment", "notes", "other"]);

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [t, locale, params] = await Promise.all([getTranslations("Resources"), getLocale(), searchParams]);
  const collegeId = uuid.safeParse(params.college).success ? params.college : undefined;
  const majorId = uuid.safeParse(params.major).success ? params.major : undefined;
  const courseId = uuid.safeParse(params.course).success ? params.course : undefined;
  const type = resourceTypes.has(params.type ?? "") ? params.type : undefined;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const [path, selection] = await Promise.all([
    params.scope === "university" ? Promise.resolve({ college: null, major: null, course: null }) : getCatalogPath(collegeId, majorId, courseId),
    getCourseSelection(courseId),
  ]);
  const universityScope = params.scope === "university" || !!selection?.requirement;
  const requirement = getUniversityRequirement(selection?.requirement ?? params.requirement);
  const college = universityScope ? null : path.college;
  const major = universityScope ? null : path.major;
  const course = universityScope ? (selection?.requirement ? selection.course : null) : path.course;
  const localName = (item: { name_ar: string; name_en: string }) => locale === "ar" ? item.name_ar : item.name_en;
  const universityCourseName = (item: { name_ar: string; name_en: string; college_names_ar?: string; college_names_en?: string }) => {
    const name = localName(item);
    const colleges = locale === "ar" ? item.college_names_ar : item.college_names_en;
    return requirement?.mode === "college" && colleges ? `${name} — ${colleges}` : name;
  };

  const [colleges, majors, courses, commonCourses, resources] = await Promise.all([
    !universityScope && !college ? getColleges() : [],
    college && !major ? getMajors(college.id) : [],
    major && !course ? getCourses(major.id) : [],
    universityScope && !course ? getUniversityCourses(requirement?.key) : [],
    course ? loadResources(course.id, type, q) : [],
  ]);
  const catalogQuery: Record<string, string> = course ? (universityScope
    ? { scope: "university", requirement: requirement!.key, course: course.id }
    : { college: college!.id, major: major!.id, course: course.id }) : {};

  return <div className="min-h-screen bg-[#f6f8fb] pb-24 pt-8">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="relative mb-8 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10">
        <div className="absolute -end-24 -top-28 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-teal-200"><BookOpen size={16} />{t("libraryBadge")}</span>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">{t("catalogSubtitle")}</p>
          </div>
          <Link href="/resources/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-3.5 font-black text-slate-950 hover:bg-teal-300"><Plus size={20} />{t("uploadResource")}</Link>
        </div>
      </section>

      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500" aria-label={t("catalogPath")}>
        <Link href="/resources" className="rounded-xl bg-white px-3 py-2 hover:text-teal-700">{t("colleges")}</Link>
        {universityScope && <><ChevronLeft size={16} /><Link href="/resources?scope=university" className="rounded-xl bg-indigo-50 px-3 py-2 text-indigo-800">{t("universityRequirements")}</Link></>}
        {universityScope && requirement && <><ChevronLeft size={16} /><Link href={`/resources?scope=university&requirement=${requirement.key}`} className="rounded-xl bg-white px-3 py-2">{localName(requirement)}</Link></>}
        {college && <><ChevronLeft size={16} /><Link href={`/resources?college=${college.id}`} className="rounded-xl bg-white px-3 py-2 hover:text-teal-700">{localName(college)}</Link></>}
        {major && <><ChevronLeft size={16} /><Link href={`/resources?college=${college!.id}&major=${major.id}`} className="rounded-xl bg-white px-3 py-2 hover:text-teal-700">{localName(major)}</Link></>}
        {course && <><ChevronLeft size={16} /><span className="rounded-xl bg-teal-50 px-3 py-2 text-teal-800">{course.code} — {localName(course)}</span></>}
      </nav>

      {!universityScope && !course && <Link href="/resources?scope=university" className="mb-8 flex items-center gap-5 rounded-3xl border border-indigo-200 bg-gradient-to-l from-indigo-50 to-white p-6 shadow-sm transition hover:border-indigo-400 hover:shadow-md sm:p-8">
        <span className="rounded-2xl bg-indigo-600 p-4 text-white"><GraduationCap size={30} /></span><div className="flex-1"><h2 className="text-xl font-black text-indigo-950 sm:text-2xl">{t("universityRequirements")}</h2><p className="mt-2 text-sm leading-7 text-slate-600">{t("universityRequirementsHint")}</p></div><ChevronLeft className="shrink-0 text-indigo-600 rtl:rotate-0 ltr:rotate-180" />
      </Link>}

      {universityScope && !course && !requirement && <CatalogGrid title={t("universityRequirements")} subtitle={t("universityRequirementsHint")} icon={<GraduationCap size={24} />}>
        {universityRequirements.map(item => {
          const variants = commonCourses.filter(row => (item.codes as readonly string[]).includes(row.code));
          const href = `/resources?scope=university&requirement=${item.key}${variants.length === 1 ? `&course=${variants[0].id}` : ""}`;
          return <CatalogLink key={item.key} href={href} title={localName(item)} icon={<BookOpen size={23} />} />;
        })}
      </CatalogGrid>}
      {universityScope && !course && requirement && <CatalogGrid title={localName(requirement)} subtitle={t("requirementVariants")} icon={<BookOpen size={24} />}>
        {commonCourses.map(item => <CatalogLink key={item.id} href={`/resources?scope=university&requirement=${requirement.key}&course=${item.id}`} title={universityCourseName(item)} eyebrow={item.code} icon={<FolderOpen size={23} />} />)}
        {!commonCourses.length && <p role="status" className="col-span-full rounded-2xl bg-white p-6 text-slate-600">{t("noCatalogCourses")}</p>}
      </CatalogGrid>}

      {!universityScope && !college && <CatalogGrid title={t("chooseCollege")} subtitle={t("chooseCollegeHint")} icon={<Building2 size={24} />}>
        {colleges.map(item => <CatalogLink key={item.id} href={`/resources?college=${item.id}`} title={localName(item)} icon={<Building2 size={23} />} />)}
      </CatalogGrid>}
      {college && !major && <CatalogGrid title={t("chooseMajor")} subtitle={t("chooseMajorHint")} icon={<GraduationCap size={24} />}>
        {majors.map(item => <CatalogLink key={item.id} href={`/resources?college=${college.id}&major=${item.id}`} title={localName(item)} icon={<GraduationCap size={23} />} />)}
      </CatalogGrid>}
      {major && !course && <CatalogGrid title={t("chooseCourse")} subtitle={t("chooseCourseHint")} icon={<FolderOpen size={24} />}>
        {courses.map(item => <CatalogLink key={item.id} href={`/resources?college=${college!.id}&major=${major.id}&course=${item.id}`} title={localName(item)} eyebrow={item.code} icon={<FolderOpen size={23} />} />)}
      </CatalogGrid>}

      {course && <p className="mb-5 rounded-2xl border border-teal-100 bg-teal-50 px-5 py-3 text-sm leading-7 text-teal-900">{t("sharedFilesHint")}</p>}
      {course && <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ResourceFilters selectedType={type} query={q} catalogQuery={catalogQuery} />
        <main>
          <form method="get" className="relative mb-6">
            {Object.entries(catalogQuery).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
            {type && <input type="hidden" name="type" value={type} />}
            <Search className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={21} />
            <input name="q" type="search" defaultValue={q} maxLength={80} placeholder={t("searchInsideCourse")} className="w-full rounded-2xl border border-slate-200 bg-white py-4 pe-28 ps-12 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" />
            <button className="absolute end-2 top-2 rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white">{t("search")}</button>
          </form>
          {resources.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{resources.map(item => <ResourceCard key={item.id} resource={item} />)}</div> :
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><FolderOpen size={48} className="mx-auto mb-4 text-slate-300" /><h2 className="text-xl font-black text-slate-900">{t("noCourseResources")}</h2><p className="mx-auto mt-2 max-w-lg text-slate-500">{t("beFirstUploader")}</p><Link href="/resources/new" className="mt-6 inline-flex rounded-xl bg-teal-600 px-5 py-3 font-bold text-white">{t("uploadResource")}</Link></div>}
        </main>
      </div>}
    </div>
  </div>;
}

async function loadResources(courseId: string, type?: string, q?: string) {
  const ids = await getEquivalentCourseIds(courseId);
  let query = createPublicClient().from("resources").select(`id, title, type, file_size, download_count, view_count, created_at, courses (name_ar, name_en), profiles!resources_uploader_id_fkey (full_name)`).eq("status", "approved").in("course_id", ids);
  if (type) query = query.eq("type", type);
  if (q) query = query.textSearch("search_vector", q, { config: "simple", type: "websearch" });
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
  if (error) throw new Error("Resources unavailable");
  return data ?? [];
}

function CatalogGrid({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return <section><div className="mb-6 flex items-center gap-4"><div className="rounded-2xl bg-teal-100 p-3 text-teal-800">{icon}</div><div><h2 className="text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 text-slate-500">{subtitle}</p></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div></section>;
}
function CatalogLink({ href, title, eyebrow, icon }: { href: string; title: string; eyebrow?: string; icon: ReactNode }) {
  return <Link href={href} className="group flex min-h-32 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl"><div className="rounded-2xl bg-slate-100 p-3 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-700">{icon}</div><div>{eyebrow && <p className="mb-1 text-xs font-black tracking-wider text-teal-700">{eyebrow}</p>}<h3 className="font-black leading-6 text-slate-900">{title}</h3></div></Link>;
}
