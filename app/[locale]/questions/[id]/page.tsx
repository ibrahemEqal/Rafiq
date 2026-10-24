import { Suspense } from "react";
import { z } from "zod";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, MessageCircle, MessagesSquare, Sparkles, UserRound } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { oneRelation } from "@/lib/data/relations";
import { parseQuestionFilters } from "@/lib/questions/validation";
import AnswerComposer from "@/components/questions/AnswerComposer";
import AnswersThread, { type AnswerView } from "@/components/questions/AnswersThread";
import QuestionActions from "@/components/questions/QuestionActions";
import ClientMessages from "@/components/shared/ClientMessages";

const PAGE_SIZE = 20;
function nestedCount(value: unknown) {
  if (!Array.isArray(value)) return 0;
  const count = value[0] && typeof value[0] === "object" && "count" in value[0] ? Number(value[0].count) : 0;
  return Number.isFinite(count) ? count : 0;
}
export default async function QuestionDetails({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, locale, route, queryParams] = await Promise.all([getTranslations("Questions"), getLocale(), params, searchParams]);
  if (!z.guid().safeParse(route.id).success) notFound();
  const client = createPublicClient();
  const { page } = parseQuestionFilters(queryParams);
  const [questionResult, answerResult] = await Promise.all([
    client.from("questions").select("id, author_id, title, body, created_at, updated_at, courses(name_ar, name_en), profiles!questions_author_id_fkey(full_name, username)").eq("id", route.id).maybeSingle(),
    client.from("answers").select("id, author_id, body, created_at, updated_at, profiles!answers_author_id_fkey(full_name, username), answer_reactions(count)").eq("question_id", route.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  ]);
  if (questionResult.error) throw new Error("Question unavailable");
  const question = questionResult.data;
  if (!question) notFound();
  const author = oneRelation(question.profiles);
  const course = oneRelation(question.courses);
  const answerRows = (answerResult.data ?? []).slice(0, PAGE_SIZE);
  const answers: AnswerView[] = answerRows.map(answer => {
    const names = oneRelation(answer.profiles);
    return { id: answer.id, authorId: answer.author_id, authorName: names?.full_name || names?.username || t("unknownUser"), body: answer.body, createdAt: answer.created_at, updatedAt: answer.updated_at, helpfulCount: nestedCount(answer.answer_reactions) };
  });
  const more = (answerResult.data?.length ?? 0) > PAGE_SIZE;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  const pageHref = (next: number) => ({ pathname: `/questions/${question.id}`, query: { page: next } });
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return <ClientMessages namespace="Questions"><main className="min-h-screen bg-canvas px-4 py-8 sm:py-12"><div className="mx-auto max-w-6xl">
    <Link href="/questions" className="inline-flex items-center gap-2 text-sm font-bold text-forest"><BackIcon size={17} />{t("back")}</Link>
    <article className="relative mt-6 overflow-hidden rounded-[2rem] border border-sage-soft bg-paper shadow-sm shadow-forest/50">
      <div className="h-2 bg-gradient-to-r from-forest via-forest to-sage" />
      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3 py-2 text-xs font-bold text-forest"><Sparkles size={14} />{t("communityQuestion")}</span><span className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3 py-2 text-xs font-bold text-muted"><BookOpen size={14} />{course ? (locale === "ar" ? course.name_ar : course.name_en) : t("general")}</span></div>
        <h1 className="mt-6 break-words text-3xl font-bold leading-[1.35] text-ink sm:text-4xl lg:text-5xl">{question.title}</h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted"><span className="inline-flex items-center gap-2 font-bold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sage-soft to-sage-soft text-forest"><UserRound size={17} /></span>{author?.full_name || author?.username || t("unknownUser")}</span><time dateTime={question.created_at} className="inline-flex items-center gap-1.5"><Clock3 size={15} />{date.format(new Date(question.created_at))}</time></div>
        <p dir="auto" className="mt-8 whitespace-pre-wrap break-words border-t border-line-soft pt-8 text-[18px] leading-10 text-ink">{question.body}</p>
        <Suspense fallback={<div className="mt-5 h-10 w-36 animate-pulse rounded-xl bg-sage-soft" />}><QuestionActions questionId={question.id} authorId={question.author_id} /></Suspense>
      </div>
    </article>
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="answers-heading" className="min-w-0 space-y-5">
        <header className="flex items-end justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-[0.18em] text-forest">{t("discussion")}</span><h2 id="answers-heading" className="mt-2 text-3xl font-bold text-ink">{t("answers")}</h2><p className="mt-2 text-sm text-muted">{t("newestFirst")}</p></div><span className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-sage-soft px-3 text-lg font-bold text-forest">{answers.length}</span></header>
        {answerResult.error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 font-semibold text-red-700">{t("answersError")}</p> : !answers.length ? <div className="rounded-[1.75rem] border-2 border-dashed border-line bg-paper p-12 text-center"><MessagesSquare size={42} className="mx-auto text-mist" /><h3 className="mt-4 text-lg font-bold text-ink">{t("noAnswersTitle")}</h3><p className="mt-2 text-sm text-muted">{t("noAnswers")}</p></div> : <Suspense fallback={<div className="space-y-4">{answers.map(answer => <div key={answer.id} className="h-64 animate-pulse rounded-[1.75rem] bg-paper" />)}</div>}><AnswersThread answers={answers} questionId={question.id} locale={locale} /></Suspense>}
        {(page > 1 || more) && <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 pt-3 text-sm font-bold">{page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-line bg-paper px-4 py-2.5">{t("previous")}</Link> : <span />}<Link href={pageHref(1)} className="text-forest">{t("latestAnswers")}</Link>{more ? <Link href={pageHref(page + 1)} className="rounded-xl border border-line bg-paper px-4 py-2.5">{t("next")}</Link> : <span />}</nav>}
      </section>
      <aside className="lg:sticky lg:top-28"><section className="overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-sm shadow-line/40"><header className="bg-forest p-6 text-white"><MessageCircle size={24} className="text-mist" /><h2 className="mt-3 text-xl font-bold">{t("shareAnswer")}</h2><p className="mt-2 text-sm leading-6 text-mist">{t("shareAnswerSubtitle")}</p></header><div className="p-6"><Suspense fallback={<p role="status" className="text-sm text-muted">{t("loadingAccount")}</p>}><AnswerComposer questionId={question.id} page={page} /></Suspense></div></section></aside>
    </div>
  </div></main></ClientMessages>;
}
