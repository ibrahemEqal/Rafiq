import { Suspense } from "react";
import { z } from "zod";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, FileStack, MessageCircleHeart, MessageSquareText, Phone, User, WandSparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { oneRelation } from "@/lib/data/relations";
import ClientMessages from "@/components/shared/ClientMessages";
import RequestComposer from "@/components/requests/RequestComposer";

const typeIcons = { book: BookOpen, resource: FileStack, other: WandSparkles } as const;

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [t, locale, route] = await Promise.all([getTranslations("Requests"), getLocale(), params]);
  if (!z.guid().safeParse(route.id).success) notFound();
  const client = createPublicClient();
  const [requestResult, responsesResult] = await Promise.all([
    client.from("requests").select("id, requester_id, title, description, type, status, created_at, courses(name_ar, name_en), profiles!requests_requester_id_fkey(full_name, username)").eq("id", route.id).maybeSingle(),
    client.from("request_responses").select("id, body, whatsapp_number, created_at, profiles!request_responses_author_id_fkey(full_name, username)").eq("request_id", route.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(50),
  ]);
  if (requestResult.error) throw new Error("Request unavailable");
  const request = requestResult.data;
  if (!request) notFound();
  const author = oneRelation(request.profiles);
  const course = oneRelation(request.courses);
  const responses = responsesResult.data ?? [];
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const TypeIcon = typeIcons[request.type as keyof typeof typeIcons] ?? WandSparkles;

  return <main className="min-h-screen bg-[#f8f7ff] px-4 py-9 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><BackIcon size={17} />{t("back")}</Link>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <article className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white p-6 shadow-lg shadow-violet-200/20 sm:p-9">
            <div aria-hidden className="absolute end-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-100 blur-2xl rtl:-translate-x-1/2" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-2 text-xs font-black text-violet-700"><TypeIcon size={15} />{t(`types.${request.type}`)}</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${request.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{request.status === "open" ? <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> : <CheckCircle2 size={14} />}{t(`statuses.${request.status}`)}</span>
              </div>
              <h1 className="mt-6 break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{request.title}</h1>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><User size={14} />{author?.full_name || author?.username || t("unknownUser")}</span>
                <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />{course ? (locale === "ar" ? course.name_ar : course.name_en) : t("general")}</span>
                <time dateTime={request.created_at} className="inline-flex items-center gap-1.5"><Clock3 size={14} />{date.format(new Date(request.created_at))}</time>
              </div>
              <p dir="auto" className="mt-7 whitespace-pre-wrap break-words border-t border-slate-100 pt-7 text-[15px] leading-8 text-slate-700">{request.description}</p>
            </div>
          </article>

          <section aria-labelledby="responses-title" className="space-y-4">
            <div className="flex items-center justify-between gap-3"><div><h2 id="responses-title" className="text-2xl font-black text-slate-900">{t("responses")}</h2><p className="mt-1 text-sm text-slate-500">{t("responsesSubtitle")}</p></div><span className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl bg-violet-100 px-3 font-black text-violet-700">{responses.length}</span></div>
            {responsesResult.error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 text-red-700">{t("responsesError")}</p> : !responses.length ? <div className="rounded-3xl border-2 border-dashed border-violet-200 bg-white p-9 text-center"><MessageSquareText size={34} className="mx-auto text-violet-300" /><p className="mt-3 font-bold text-slate-600">{t("noResponses")}</p></div> : responses.map(response => {
              const responder = oneRelation(response.profiles);
              return <article key={response.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <header className="mb-4 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 font-extrabold text-slate-800"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-sky-100 text-sm text-violet-700">{(responder?.full_name || responder?.username || "R").slice(0, 1)}</span>{responder?.full_name || responder?.username || t("unknownUser")}</span><time dateTime={response.created_at} className="text-xs text-slate-400">{date.format(new Date(response.created_at))}</time></header>
                <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-700">{response.body}</p>
                {response.whatsapp_number && <a href={`https://wa.me/${response.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2.5 text-sm font-extrabold text-[#128C7E] transition hover:bg-[#25D366] hover:text-white"><Phone size={16} />{t("contactWhatsapp")}</a>}
              </article>;
            })}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <ClientMessages namespace="Requests"><Suspense fallback={<div className="h-56 animate-pulse rounded-3xl bg-white" />}><RequestComposer requestId={request.id} requesterId={request.requester_id} status={request.status} /></Suspense></ClientMessages>
          <div className="rounded-3xl bg-slate-950 p-6 text-white"><MessageCircleHeart size={24} className="text-violet-300" /><h2 className="mt-4 font-black">{t("kindnessTitle")}</h2><p className="mt-2 text-xs leading-6 text-slate-400">{t("kindnessText")}</p></div>
        </aside>
      </div>
    </div>
  </main>;
}
