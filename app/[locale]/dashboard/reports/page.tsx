import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/admin/resource-review";
import { parseReportFilters, reportStatuses, type ReportStatus } from "@/lib/admin/report-review";
import ClientMessages from "@/components/shared/ClientMessages";
import ReportReviewActions from "@/components/admin/ReportReviewActions";
import { AlertTriangle, Clock, ExternalLink, User } from "lucide-react";

const PAGE_SIZE = 20;
const statusStyle: Record<ReportStatus, string> = {
  pending: "bg-amber-50 text-amber-800", reviewed: "bg-teal-50 text-teal-700", dismissed: "bg-slate-100 text-slate-600",
};

export default async function ReportsDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, locale, params, client] = await Promise.all([getTranslations("Admin"), getLocale(), searchParams, createClient()]);
  const access = await getAdminAccess(client);
  if (!access.userId) redirect({ href: "/auth/login", locale });
  if (!access.isAdmin) notFound();
  const { status, page } = parseReportFilters(params);
  const { data, count, error } = await client.from("reports")
    .select("id, reporter_id, target_type, target_id, reason, status, created_at", { count: "exact" })
    .eq("status", status).order("created_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = data ?? [];
  const ids = (type: string) => rows.filter(row => row.target_type === type).map(row => row.target_id);
  const reporterIds = [...new Set(rows.map(row => row.reporter_id))];
  const [profiles, questions, answers, resources, books, requests] = rows.length ? await Promise.all([
    client.from("profiles").select("id, full_name, username").in("id", reporterIds),
    ids("question").length ? client.from("questions").select("id, title").in("id", ids("question")) : Promise.resolve({ data: [], error: null }),
    ids("answer").length ? client.from("answers").select("id, body, question_id").in("id", ids("answer")) : Promise.resolve({ data: [], error: null }),
    ids("resource").length ? client.from("resources").select("id, title").in("id", ids("resource")) : Promise.resolve({ data: [], error: null }),
    ids("book_offer").length ? client.from("books").select("id, title").in("id", ids("book_offer")) : Promise.resolve({ data: [], error: null }),
    ids("request").length ? client.from("requests").select("id, title").in("id", ids("request")) : Promise.resolve({ data: [], error: null }),
  ]) : Array.from({ length: 6 }, () => ({ data: [], error: null }));
  const reporters = new Map((profiles.data ?? []).map(profile => [profile.id, profile.full_name || profile.username]));
  const targets = new Map<string, { text: string; href?: string }>();
  for (const item of questions.data ?? []) targets.set(`question:${item.id}`, { text: item.title, href: `/questions/${item.id}` });
  for (const item of answers.data ?? []) targets.set(`answer:${item.id}`, { text: item.body.slice(0, 180), href: `/questions/${item.question_id}` });
  for (const item of resources.data ?? []) targets.set(`resource:${item.id}`, { text: item.title, href: `/resources/${item.id}` });
  for (const item of books.data ?? []) targets.set(`book_offer:${item.id}`, { text: item.title, href: "/books" });
  for (const item of requests.data ?? []) targets.set(`request:${item.id}`, { text: item.title });
  const metadataError = [profiles, questions, answers, resources, books, requests].some(result => result.error);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  if (!error && page > totalPages) redirect({ href: { pathname: "/dashboard/reports", query: { status, page: totalPages } }, locale });
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

  return <ClientMessages namespace="Admin"><section className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"><div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-amber-200"><AlertTriangle size={16} />{t("reports")}</div><h1 className="text-2xl font-extrabold sm:text-3xl">{t("reportsTitle")}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{t("reportsSubtitle")}</p><Link href="/dashboard" className="mt-5 inline-block text-sm font-bold text-teal-300">{t("resourceReviews")}</Link></header>
    <nav aria-label={t("reportFilters")} className="flex flex-wrap gap-2">{reportStatuses.map(item => <Link key={item} href={{ pathname: "/dashboard/reports", query: { status: item } }} aria-current={status === item ? "page" : undefined} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${status === item ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{t(`reportStatuses.${item}`)}</Link>)}</nav>
    {error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 text-red-700">{t("reportsLoadError")}</p> : <>
      <div className="flex justify-between text-sm text-slate-500"><p>{t("reportsTotal", { count: count ?? 0 })}</p><p>{t("page", { page, total: totalPages })}</p></div>
      {metadataError && <p role="alert" className="text-sm text-amber-700">{t("reportMetadataError")}</p>}
      {!rows.length ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">{t("reportsEmpty")}</div> : <div className="space-y-4">{rows.map(report => {
        const target = targets.get(`${report.target_type}:${report.target_id}`);
        return <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><h2 className="font-bold text-slate-900">{t(`targetTypes.${report.target_type}`)}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[report.status as ReportStatus]}`}>{t(`reportStatuses.${report.status}`)}</span></div>
          <p dir="auto" className="mb-4 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{report.reason}</p>
          <div className="mb-4 space-y-2 text-xs text-slate-500"><p className="flex items-center gap-2"><User size={14} />{reporters.get(report.reporter_id) || t("unknownReporter")}</p><p className="flex items-center gap-2"><Clock size={14} /><time dateTime={report.created_at}>{date.format(new Date(report.created_at))}</time></p></div>
          {target ? <div className="mb-5 rounded-xl border border-slate-200 p-4"><p dir="auto" className="break-words text-sm text-slate-700">{target.text}</p>{target.href && <Link href={target.href} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700"><ExternalLink size={14} />{t("openTarget")}</Link>}</div> : <p className="mb-5 text-sm text-red-700">{t("targetMissing")}</p>}
          <ReportReviewActions reportId={report.id} status={report.status as ReportStatus} />
        </article>;
      })}</div>}
      <nav aria-label={t("pagination")} className="flex justify-between">{page > 1 ? <Link href={{ pathname: "/dashboard/reports", query: { status, page: page - 1 } }} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">{t("previous")}</Link> : <span />}{page < totalPages ? <Link href={{ pathname: "/dashboard/reports", query: { status, page: page + 1 } }} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">{t("next")}</Link> : <span />}</nav>
    </>}
  </div></section></ClientMessages>;
}
