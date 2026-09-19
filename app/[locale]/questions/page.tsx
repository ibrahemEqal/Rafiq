import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { getCourses } from "@/lib/data/catalog";
import { oneRelation } from "@/lib/data/relations";
import { parseQuestionFilters } from "@/lib/questions/validation";
import { MessageCircle, Plus, Search, BookOpen, User, Clock } from "lucide-react";

const PAGE_SIZE = 20;

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filtersPromise = searchParams.then(parseQuestionFilters);
  const questionsPromise = filtersPromise.then((filters) => {
    const client = createPublicClient();
    let query = client.from("questions").select("id, title, created_at, courses(name_ar, name_en), profiles!questions_author_id_fkey(full_name, username)");
    if (filters.q) query = query.textSearch("search_vector", filters.q, { config: "simple", type: "websearch" });
    if (filters.course) query = query.eq("course_id", filters.course);
    // One look-ahead row, no COUNT(*) or per-card answer/profile requests.
    return query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);
  });
  // Do not wait for a cold course catalog before starting the question query.
  const [t, locale, { q, course, page }, courses, { data, error }] = await Promise.all([
    getTranslations("Questions"), getLocale(), filtersPromise, getCourses(), questionsPromise,
  ]);
  const rows = (data ?? []).slice(0, PAGE_SIZE);
  const more = (data?.length ?? 0) > PAGE_SIZE;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  const pageHref = (next: number) => ({ pathname: "/questions", query: { ...(q ? { q } : {}), ...(course ? { course } : {}), page: next } });

  return <section className="min-h-screen bg-slate-50 px-4 py-10 sm:py-12">
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div><h1 className="text-3xl font-extrabold text-slate-900">{t("title")}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{t("subtitle")}</p></div>
        <Link href="/questions/new" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white hover:bg-teal-700"><Plus size={18} />{t("ask")}</Link>
      </header>
      <form method="get" className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label htmlFor="question-search" className="sr-only">{t("search")}</label>
        <input id="question-search" type="search" name="q" defaultValue={q} maxLength={80} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500" />
        <label htmlFor="question-course-filter" className="sr-only">{t("course")}</label>
        <select id="question-course-filter" name="course" defaultValue={course ?? ""} className="max-w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-teal-500">
          <option value="">{t("allCourses")}</option>{courses.map(item => <option key={item.id} value={item.id}>{locale === "ar" ? item.name_ar : item.name_en}</option>)}
        </select>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"><Search size={17} />{t("search")}</button>
      </form>
      {error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 text-red-700">{t("loadError")}</p> : <>
        {!rows.length ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <MessageCircle size={36} className="mx-auto mb-4 text-slate-300" /><h2 className="font-bold text-slate-700">{t("empty")}</h2>
          <Link href={pageHref(1)} className="mt-4 inline-block text-sm font-bold text-teal-700">{t("latest")}</Link>
        </div> : <div className="space-y-4">{rows.map(question => {
          const names = oneRelation(question.profiles);
          const courseName = oneRelation(question.courses);
          return <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 break-words text-lg font-bold text-slate-900"><Link href={`/questions/${question.id}`} className="hover:text-teal-700">{question.title}</Link></h2>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><User size={14} />{names?.full_name || names?.username || t("unknownUser")}</span>
              <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />{courseName ? (locale === "ar" ? courseName.name_ar : courseName.name_en) : t("general")}</span>
              <time dateTime={question.created_at} className="inline-flex items-center gap-1.5"><Clock size={14} />{date.format(new Date(question.created_at))}</time>
            </div>
            <Link href={`/questions/${question.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-teal-700"><MessageCircle size={16} />{t("viewAnswers")}</Link>
          </article>;
        })}</div>}
        <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 text-sm font-bold">
          {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2">{t("previous")}</Link> : <span />}
          <span className="text-slate-500">{t("page", { page })}</span>
          {more ? <Link href={pageHref(page + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2">{t("next")}</Link> : <span />}
        </nav>
      </>}
    </div>
  </section>;
}
