import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess, parseReviewFilters, resourceStatuses, type ResourceStatus } from "@/lib/admin/resource-review";
import ResourceReviewActions from "@/components/admin/ResourceReviewActions";
import ClientMessages from "@/components/shared/ClientMessages";
import { ShieldCheck, FileText, User, BookOpen, Clock, MessageCircleQuestion, HandHeart, AlertTriangle, Users, ExternalLink } from "lucide-react";

const PAGE_SIZE = 20;
const statusStyle: Record<ResourceStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal-50 text-teal-700",
  rejected: "bg-red-50 text-red-700",
  removed: "bg-slate-100 text-slate-600",
};

export default async function AdminDashboard({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, locale, params, supabase] = await Promise.all([
    getTranslations("Admin"), getLocale(), searchParams, createClient(),
  ]);
  const access = await getAdminAccess(supabase);
  if (!access.userId) redirect({ href: "/auth/login", locale });
  if (!access.isAdmin) notFound();

  const { status, page } = parseReviewFilters(params);
  const [
    resourceResult,
    profilesCount,
    booksCount,
    requestsCount,
    questionsCount,
    reportsCount,
  ] = await Promise.all([
    supabase.from("resources")
      .select("id, title, type, status, source_type, created_at, file_size, course_id, uploader_id", { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("requests").select("id", { count: "exact", head: true }),
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
  ]);

  const { data: resources, count, error } = resourceResult;
  const rows = resources ?? [];
  const courseIds = [...new Set(rows.map((row) => row.course_id as string))];
  const userIds = [...new Set(rows.map((row) => row.uploader_id as string))];
  const [courseResult, profileResult] = rows.length ? await Promise.all([
    supabase.from("courses").select("id, name_ar, name_en").in("id", courseIds),
    supabase.from("profiles").select("id, full_name, username").in("id", userIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];

  const courseById = new Map((courseResult.data ?? []).map((course) => [course.id, locale === "ar" ? course.name_ar : course.name_en]));
  const userById = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile.full_name || profile.username]));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  if (!error && page > totalPages) redirect({ href: { pathname: "/dashboard", query: { status, page: totalPages } }, locale });
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });

  const overview = [
    { label: t("overview.users"), count: profilesCount.count ?? 0, href: "/profile", icon: Users },
    { label: t("overview.books"), count: booksCount.count ?? 0, href: "/books", icon: BookOpen },
    { label: t("overview.requests"), count: requestsCount.count ?? 0, href: "/requests", icon: HandHeart },
    { label: t("overview.questions"), count: questionsCount.count ?? 0, href: "/questions", icon: MessageCircleQuestion },
    { label: t("overview.reports"), count: reportsCount.count ?? 0, href: "/dashboard/reports", icon: AlertTriangle },
  ];

  return (
    <ClientMessages namespace="Admin">
      <section className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-7">
          <header className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-base text-teal-200"><ShieldCheck size={18} />{t("adminOnly")}</div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{t("siteTitle")}</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-300">{t("siteSubtitle")}</p>
          </header>

          <section aria-labelledby="site-overview">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 id="site-overview" className="text-xl font-extrabold text-slate-900">{t("overview.title")}</h2>
                <p className="mt-1 text-base text-slate-500">{t("overview.subtitle")}</p>
              </div>
              <Link href="/resources" className="inline-flex items-center gap-1.5 text-base font-bold text-teal-700">{t("overview.openSite")}<ExternalLink size={16} /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {overview.map(({ label, count: itemCount, href, icon: Icon }) => (
                <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                  <Icon size={22} className="mb-3 text-teal-600" />
                  <p className="text-2xl font-black text-slate-900">{itemCount}</p>
                  <p className="mt-1 text-base font-semibold text-slate-600">{label}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">{t("title")}</h2>
              <p className="mt-1 text-base text-slate-500">{t("subtitle")}</p>
            </div>
            <Link href="/dashboard/reports" className="rounded-xl bg-amber-50 px-4 py-2.5 text-base font-bold text-amber-800">{t("openReports")}</Link>
          </div>

          <nav aria-label={t("filters")} className="flex flex-wrap gap-2">
            {resourceStatuses.map((item) => <Link key={item} href={{ pathname: "/dashboard", query: { status: item } }} aria-current={status === item ? "page" : undefined}
              className={`rounded-xl px-4 py-2.5 text-base font-bold ${status === item ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>
              {t(`statuses.${item}`)}
            </Link>)}
          </nav>

          {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-base text-red-700">{t("loadError")}</p> : <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-base text-slate-500">
              <p>{t("total", { count: count ?? 0 })}</p>
              <p>{t("page", { page, total: totalPages })}</p>
            </div>
            {(courseResult.error || profileResult.error) && <p role="alert" className="text-base text-amber-700">{t("metadataError")}</p>}

            {!rows.length ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-300" /><p className="text-base text-slate-500">{t("empty")}</p>
            </div> : <div className="space-y-4">
              {rows.map((resource) => <article key={resource.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words text-xl font-bold text-slate-900">{resource.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusStyle[resource.status as ResourceStatus]}`}>{t(`statuses.${resource.status}`)}</span>
                </div>
                <dl className="mb-5 grid gap-3 text-base text-slate-500 sm:grid-cols-2">
                  <div className="flex items-center gap-2"><User size={17} /><dt className="sr-only">{t("uploader")}</dt><dd>{userById.get(resource.uploader_id) || t("unknownUser")}</dd></div>
                  <div className="flex items-center gap-2"><BookOpen size={17} /><dt className="sr-only">{t("course")}</dt><dd>{courseById.get(resource.course_id) || t("unknownCourse")}</dd></div>
                  <div className="flex items-center gap-2"><FileText size={17} /><dt className="sr-only">{t("file")}</dt><dd>{t(`types.${resource.type}`)} · {resource.source_type === "external" ? t("externalLink") : `${(Number(resource.file_size) / 1024 / 1024).toFixed(2)} MB`}</dd></div>
                  <div className="flex items-center gap-2"><Clock size={17} /><dt className="sr-only">{t("uploaded")}</dt><dd><time dateTime={resource.created_at}>{dateFormat.format(new Date(resource.created_at))}</time></dd></div>
                </dl>
                <ResourceReviewActions resourceId={resource.id} status={resource.status as ResourceStatus} />
              </article>)}
            </div>}

            <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3">
              {page > 1 ? <Link href={{ pathname: "/dashboard", query: { status, page: page - 1 } }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold">{t("previous")}</Link> : <span />}
              {page < totalPages && <Link href={{ pathname: "/dashboard", query: { status, page: page + 1 } }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-semibold">{t("next")}</Link>}
            </nav>
          </>}
        </div>
      </section>
    </ClientMessages>
  );
}
