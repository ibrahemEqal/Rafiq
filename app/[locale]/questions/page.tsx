import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Clock3, MessageCircle, MessagesSquare, Plus, Search, Sparkles, UserRound } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { getCourses } from "@/lib/data/catalog";
import { oneRelation } from "@/lib/data/relations";
import { parseQuestionFilters } from "@/lib/questions/validation";

const PAGE_SIZE = 20;
function nestedCount(value: unknown) {
  if (!Array.isArray(value)) return 0;
  const count = value[0] && typeof value[0] === "object" && "count" in value[0] ? Number(value[0].count) : 0;
  return Number.isFinite(count) ? count : 0;
}
export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filtersPromise = searchParams.then(parseQuestionFilters);
  const questionsPromise = filtersPromise.then(filters => {
    const client = createPublicClient();
    let query = client.from("questions").select("id, title, body, created_at, courses(name_ar, name_en), profiles!questions_author_id_fkey(full_name, username), answers(count)");
    if (filters.q) query = query.textSearch("search_vector", filters.q, { config: "simple", type: "websearch" });
    if (filters.course) query = query.eq("course_id", filters.course);
    return query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);
  });
  const [t, locale, { q, course, page }, courses, { data, error }] = await Promise.all([
    getTranslations("Questions"), getLocale(), filtersPromise, getCourses(), questionsPromise,
  ]);
  const rows = (data ?? []).slice(0, PAGE_SIZE);
  const more = (data?.length ?? 0) > PAGE_SIZE;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  const pageHref = (next: number) => ({ pathname: "/questions", query: { ...(q ? { q } : {}), ...(course ? { course } : {}), ...(next > 1 ? { page: next } : {}) } });

  return <main className="min-h-screen overflow-hidden bg-[#f7f8fc]">
    <section className="relative border-b border-indigo-900 bg-slate-950 px-4 py-14 text-white sm:py-20">
      <div aria-hidden className="absolute inset-0 overflow-hidden"><div className="absolute -start-24 -top-32 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" /><div className="absolute -bottom-40 end-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" /><div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:25px_25px]" /></div>
      <div className="relative mx-auto max-w-6xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-violet-100"><Sparkles size={15} />{t("communitySpace")}</span><div className="mt-6 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end"><div className="max-w-3xl"><h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t("title")}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{t("subtitle")}</p></div><Link href="/questions/new" className="group inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 shadow-2xl shadow-violet-950/40 transition hover:-translate-y-1 hover:bg-violet-50"><span className="rounded-xl bg-violet-100 p-2 text-violet-700"><Plus size={20} /></span>{t("ask")}</Link></div></div>
    </section>

    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:py-12">
      <form method="get" className="relative -mt-16 grid gap-3 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-violet-200/30 backdrop-blur sm:grid-cols-[1fr_auto_auto] sm:p-5">
        <label htmlFor="question-search" className="sr-only">{t("search")}</label><div className="relative"><Search size={19} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" /><input id="question-search" type="search" name="q" defaultValue={q} maxLength={80} placeholder={t("searchPlaceholder")} className="w-full rounded-2xl border border-slate-200 py-3.5 pe-4 ps-12 text-base outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /></div>
        <label htmlFor="question-course-filter" className="sr-only">{t("course")}</label><select id="question-course-filter" name="course" defaultValue={course ?? ""} className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-violet-400"><option value="">{t("allCourses")}</option>{courses.map(item => <option key={item.id} value={item.id}>{locale === "ar" ? item.name_ar : item.name_en}</option>)}</select>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-6 py-3.5 font-extrabold text-white hover:bg-violet-800"><Search size={17} />{t("search")}</button>
      </form>

      {error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 font-semibold text-red-700">{t("loadError")}</p> : !rows.length ? <section className="rounded-[2rem] border-2 border-dashed border-violet-200 bg-white p-12 text-center"><MessagesSquare size={44} className="mx-auto text-violet-300" /><h2 className="mt-4 text-xl font-black text-slate-700">{t("empty")}</h2><Link href={pageHref(1)} className="mt-5 inline-block font-extrabold text-violet-700">{t("latest")}</Link></section> : <div className="space-y-4">{rows.map((question, index) => {
        const names = oneRelation(question.profiles);
        const courseName = oneRelation(question.courses);
        const count = nestedCount(question.answers);
        return <article key={question.id} className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/70 sm:p-7">
          <div className="flex items-start gap-4 sm:gap-6"><span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-lg font-black text-violet-700 sm:flex">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-extrabold text-violet-700"><BookOpen size={13} />{courseName ? (locale === "ar" ? courseName.name_ar : courseName.name_en) : t("general")}</span><time dateTime={question.created_at} className="inline-flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={13} />{date.format(new Date(question.created_at))}</time></div><h2 className="mt-4 break-words text-xl font-black leading-8 text-slate-950 sm:text-2xl"><Link href={`/questions/${question.id}`} className="after:absolute after:inset-0 group-hover:text-violet-800">{question.title}</Link></h2><p dir="auto" className="mt-3 line-clamp-2 break-words text-[15px] leading-7 text-slate-500">{question.body}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-600"><UserRound size={16} /><span className="truncate">{names?.full_name || names?.username || t("unknownUser")}</span></span><span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${count ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><MessageCircle size={16} />{t("answerCount", { count })}</span></div></div></div>
        </article>;
      })}</div>}

      <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 pt-3 text-sm font-extrabold">{page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">{t("previous")}</Link> : <span />}<span className="text-slate-500">{t("page", { page })}</span>{more ? <Link href={pageHref(page + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">{t("next")}</Link> : <span />}</nav>
    </div>
  </main>;
}
