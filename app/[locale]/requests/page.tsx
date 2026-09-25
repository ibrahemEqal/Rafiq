import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, CheckCircle2, Clock3, FileStack, HandHeart, MessageCircleHeart, Plus, Search, Sparkles, User, WandSparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { getCourses } from "@/lib/data/catalog";
import { oneRelation } from "@/lib/data/relations";
import { parseRequestFilters } from "@/lib/requests/validation";

const PAGE_SIZE = 18;

const typeStyle = {
  book: { icon: BookOpen, color: "bg-amber-100 text-amber-700 ring-amber-200" },
  resource: { icon: FileStack, color: "bg-sky-100 text-sky-700 ring-sky-200" },
  other: { icon: WandSparkles, color: "bg-violet-100 text-violet-700 ring-violet-200" },
} as const;

function responseCount(value: unknown) {
  if (!Array.isArray(value)) return 0;
  const count = value[0] && typeof value[0] === "object" && "count" in value[0] ? Number(value[0].count) : 0;
  return Number.isFinite(count) ? count : 0;
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filtersPromise = searchParams.then(parseRequestFilters);
  const requestsPromise = filtersPromise.then(filters => {
    const client = createPublicClient();
    let query = client.from("requests").select(`
      id, title, description, type, status, created_at,
      courses(name_ar, name_en),
      profiles!requests_requester_id_fkey(full_name, username),
      request_responses(count)
    `);
    if (filters.q) query = query.textSearch("search_vector", filters.q, { config: "simple", type: "websearch" });
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.course) query = query.eq("course_id", filters.course);
    return query.order("created_at", { ascending: false }).order("id", { ascending: false })
      .range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);
  });

  const [t, locale, filters, courses, result] = await Promise.all([
    getTranslations("Requests"), getLocale(), filtersPromise, getCourses(), requestsPromise,
  ]);
  const rows = (result.data ?? []).slice(0, PAGE_SIZE);
  const more = (result.data?.length ?? 0) > PAGE_SIZE;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  const href = (overrides: Partial<typeof filters>) => {
    const next = { ...filters, ...overrides };
    return { pathname: "/requests" as const, query: {
      ...(next.q ? { q: next.q } : {}), ...(next.type ? { type: next.type } : {}),
      ...(next.status ? { status: next.status } : {}), ...(next.course ? { course: next.course } : {}),
      ...(next.page > 1 ? { page: next.page } : {}),
    } };
  };

  return <main className="min-h-screen overflow-hidden bg-[#f8f7ff]">
    <section className="relative border-b border-violet-100 bg-slate-950 px-4 py-14 text-white sm:py-20">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute -start-24 -top-32 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute -bottom-40 end-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>
      <div className="relative mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-violet-100 backdrop-blur">
          <Sparkles size={15} />{t("eyebrow")}
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t("title")}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{t("subtitle")}</p>
          </div>
          <Link href="/requests/new" className="group inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 shadow-2xl shadow-violet-950/40 transition hover:-translate-y-1 hover:bg-violet-50">
            <span className="rounded-xl bg-violet-100 p-2 text-violet-700 transition group-hover:rotate-6"><Plus size={20} /></span>{t("newRequest")}
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-bold">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-emerald-200"><HandHeart size={16} />{t("quickCommunity")}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-400/15 px-4 py-2 text-sky-200"><MessageCircleHeart size={16} />{t("realResponses")}</span>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:py-12">
      <form method="get" className="relative -mt-16 grid gap-3 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-violet-200/30 backdrop-blur sm:grid-cols-[1fr_auto_auto] sm:p-5">
        <label htmlFor="request-search" className="sr-only">{t("search")}</label>
        <div className="relative"><Search size={19} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="request-search" type="search" name="q" defaultValue={filters.q} maxLength={80} placeholder={t("searchPlaceholder")} className="w-full rounded-2xl border border-slate-200 py-3.5 pe-4 ps-12 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
        </div>
        <select name="course" defaultValue={filters.course ?? ""} aria-label={t("course")} className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-violet-400">
          <option value="">{t("allCourses")}</option>{courses.map(course => <option key={course.id} value={course.id}>{locale === "ar" ? course.name_ar : course.name_en}</option>)}
        </select>
        <button type="submit" className="rounded-2xl bg-violet-700 px-6 py-3.5 font-extrabold text-white transition hover:bg-violet-800">{t("search")}</button>
        {filters.type && <input type="hidden" name="type" value={filters.type} />}
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
      </form>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ type: null, page: 1 })} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${!filters.type ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-violet-50"}`}>{t("allTypes")}</Link>
          {(["book", "resource", "other"] as const).map(type => <Link key={type} href={href({ type, page: 1 })} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${filters.type === type ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-violet-50"}`}>{t(`types.${type}`)}</Link>)}
        </div>
        <div className="flex rounded-full bg-white p-1 text-xs font-extrabold shadow-sm">
          {(["open", "fulfilled"] as const).map(status => <Link key={status} href={href({ status, page: 1 })} className={`rounded-full px-4 py-2 transition ${filters.status === status ? "bg-violet-100 text-violet-800" : "text-slate-500"}`}>{t(`statuses.${status}`)}</Link>)}
        </div>
      </div>

      {result.error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 font-semibold text-red-700">{t("loadError")}</p> : !rows.length ? <section className="rounded-[2rem] border-2 border-dashed border-violet-200 bg-white p-12 text-center sm:p-16">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600"><HandHeart size={30} /></span>
        <h2 className="mt-5 text-xl font-black text-slate-800">{t("empty")}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">{t("emptySubtitle")}</p>
        <Link href="/requests/new" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-extrabold text-white"><Plus size={18} />{t("newRequest")}</Link>
      </section> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{rows.map(request => {
        const style = typeStyle[request.type as keyof typeof typeStyle] ?? typeStyle.other;
        const Icon = style.icon;
        const author = oneRelation(request.profiles);
        const course = oneRelation(request.courses);
        const count = responseCount(request.request_responses);
        return <article key={request.id} className="group relative flex min-h-80 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-200/30">
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${style.color}`}><Icon size={22} /></span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${request.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {request.status === "open" ? <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> : <CheckCircle2 size={13} />}{t(`statuses.${request.status}`)}
            </span>
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-wider text-violet-600">{t(`types.${request.type}`)}</p>
          <h2 className="mt-2 line-clamp-2 break-words text-xl font-black leading-8 text-slate-900"><Link href={`/requests/${request.id}`} className="after:absolute after:inset-0">{request.title}</Link></h2>
          <p dir="auto" className="mt-3 line-clamp-3 break-words text-sm leading-7 text-slate-500">{request.description}</p>
          <div className="mt-auto space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex items-center justify-between gap-3"><span className="inline-flex min-w-0 items-center gap-1.5"><User size={14} /><span className="truncate">{author?.full_name || author?.username || t("unknownUser")}</span></span><time dateTime={request.created_at} className="inline-flex shrink-0 items-center gap-1"><Clock3 size={13} />{date.format(new Date(request.created_at))}</time></div>
            <div className="flex items-center justify-between gap-3"><span className="truncate font-bold text-slate-600">{course ? (locale === "ar" ? course.name_ar : course.name_en) : t("general")}</span><span className="inline-flex shrink-0 items-center gap-1.5 font-black text-violet-700"><MessageCircleHeart size={15} />{t("responseCount", { count })}</span></div>
          </div>
        </article>;
      })}</div>}

      {(filters.page > 1 || more) && <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 pt-3 text-sm font-extrabold">
        {filters.page > 1 ? <Link href={href({ page: filters.page - 1 })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">{t("previous")}</Link> : <span />}
        <span className="text-slate-500">{t("page", { page: filters.page })}</span>
        {more ? <Link href={href({ page: filters.page + 1 })} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">{t("next")}</Link> : <span />}
      </nav>}
    </div>
  </main>;
}
