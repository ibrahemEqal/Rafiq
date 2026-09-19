import { Suspense } from "react";
import { z } from "zod";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { oneRelation } from "@/lib/data/relations";
import { parseQuestionFilters } from "@/lib/questions/validation";
import AnswerComposer from "@/components/questions/AnswerComposer";
import { User, BookOpen } from "lucide-react";

const PAGE_SIZE = 20;

export default async function QuestionDetails({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, locale, route, queryParams] = await Promise.all([getTranslations("Questions"), getLocale(), params, searchParams]);
  if (!z.guid().safeParse(route.id).success) notFound();
  const client = createPublicClient();
  const { page } = parseQuestionFilters(queryParams);
  const [questionResult, answerResult] = await Promise.all([
    client.from("questions").select("id, title, body, created_at, courses(name_ar, name_en), profiles!questions_author_id_fkey(full_name, username)").eq("id", route.id).maybeSingle(),
    client.from("answers").select("id, body, created_at, profiles!answers_author_id_fkey(full_name, username)").eq("question_id", route.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  ]);
  if (questionResult.error) throw new Error("Question unavailable");
  const question = questionResult.data;
  if (!question) notFound();
  const author = oneRelation(question.profiles);
  const course = oneRelation(question.courses);
  const answers = (answerResult.data ?? []).slice(0, PAGE_SIZE);
  const more = (answerResult.data?.length ?? 0) > PAGE_SIZE;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  const pageHref = (next: number) => ({ pathname: `/questions/${question.id}`, query: { page: next } });

  return <section className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-3xl space-y-6">
    <Link href="/questions" className="text-sm font-bold text-teal-700">{t("back")}</Link>
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="break-words text-2xl font-extrabold leading-relaxed text-slate-900 sm:text-3xl">{question.title}</h1>
      <div className="my-5 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><User size={14} />{author?.full_name || author?.username || t("unknownUser")}</span>
        <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />{course ? (locale === "ar" ? course.name_ar : course.name_en) : t("general")}</span>
        <time dateTime={question.created_at}>{date.format(new Date(question.created_at))}</time>
      </div>
      <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-700">{question.body}</p>
    </article>
    <section aria-labelledby="answers-heading" className="space-y-4">
      <h2 id="answers-heading" className="text-xl font-extrabold text-slate-900">{t("answers")}</h2>
      <p className="text-xs text-slate-500">{t("newestFirst")}</p>
      {answerResult.error ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{t("answersError")}</p> : <>
        {!answers.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{t("noAnswers")}</p>}
        {answers.map(answer => {
          const names = oneRelation(answer.profiles);
          return <article key={answer.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span className="font-bold text-slate-700">{names?.full_name || names?.username || t("unknownUser")}</span><time dateTime={answer.created_at}>{date.format(new Date(answer.created_at))}</time></header>
            <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-700">{answer.body}</p>
          </article>;
        })}
        {(page > 1 || more) && <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 text-sm font-bold">
          {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2">{t("previous")}</Link> : <span />}
          <Link href={pageHref(1)} className="text-slate-500">{t("latestAnswers")}</Link>
          {more ? <Link href={pageHref(page + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2">{t("next")}</Link> : <span />}
        </nav>}
      </>}
    </section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <Suspense fallback={<p role="status" className="text-sm text-slate-500">{t("loadingAccount")}</p>}><AnswerComposer questionId={question.id} page={page} /></Suspense>
    </section>
  </div></section>;
}
