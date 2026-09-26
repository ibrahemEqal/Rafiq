import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { oneRelation } from "@/lib/data/relations";
import ForumPostActions from "./ForumPostActions";
import AnswerInteractions from "./AnswerInteractions";
import { BadgeCheck, UserRound } from "lucide-react";

export type AnswerView = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  helpfulCount: number;
};

export default async function AnswersThread({ answers, questionId, locale }: { answers: AnswerView[]; questionId: string; locale: string }) {
  if (!answers.length) return null;
  const answerIds = answers.map(answer => answer.id);
  const privateClient = await createClient();
  const identityPromise = getVerifiedIdentity(privateClient);
  const commentsPromise = createPublicClient().from("answer_comments")
    .select("id, answer_id, author_id, body, created_at, profiles!answer_comments_author_id_fkey(full_name, username)")
    .in("answer_id", answerIds).order("created_at", { ascending: true }).order("id", { ascending: true }).limit(200);
  const identity = await identityPromise;
  const [commentsResult, profileResult, likedResult] = await Promise.all([
    commentsPromise,
    identity ? privateClient.from("profiles").select("role").eq("id", identity.id).maybeSingle() : Promise.resolve({ data: null }),
    identity ? privateClient.from("answer_reactions").select("answer_id").eq("user_id", identity.id).in("answer_id", answerIds) : Promise.resolve({ data: [] }),
  ]);
  const isAdmin = profileResult.data?.role === "admin";
  const liked = new Set((likedResult.data ?? []).map(item => item.answer_id));
  const commentsByAnswer = new Map<string, Array<{ id: string; body: string; authorName: string; createdAt: string; canDelete: boolean }>>();
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", { dateStyle: "medium", timeZone: "UTC" });
  for (const comment of commentsResult.data ?? []) {
    const author = oneRelation(comment.profiles);
    const list = commentsByAnswer.get(comment.answer_id) ?? [];
    list.push({
      id: comment.id,
      body: comment.body,
      authorName: author?.full_name || author?.username || (locale === "ar" ? "طالب" : "Student"),
      createdAt: date.format(new Date(comment.created_at)),
      canDelete: Boolean(identity && (identity.id === comment.author_id || isAdmin)),
    });
    commentsByAnswer.set(comment.answer_id, list);
  }

  return <div className="space-y-5">{answers.map((answer, index) => {
    const canManage = Boolean(identity && (identity.id === answer.authorId || isAdmin));
    const canReport = Boolean(identity && identity.id !== answer.authorId && !isAdmin);
    const edited = answer.updatedAt !== answer.createdAt;
    return <article key={answer.id} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/60">
      <div className="p-6 sm:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-violet-700"><UserRound size={20} /></span><div className="min-w-0"><p className="truncate font-extrabold text-slate-900">{answer.authorName}</p><p className="mt-1 text-xs text-slate-400">{date.format(new Date(answer.createdAt))}{edited ? (locale === "ar" ? " · عُدّلت" : " · edited") : ""}</p></div></div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700"><BadgeCheck size={14} />#{index + 1}</span>
        </header>
        <p dir="auto" className="whitespace-pre-wrap break-words text-[17px] leading-9 text-slate-800">{answer.body}</p>
        <AnswerInteractions answerId={answer.id} initialHelpfulCount={answer.helpfulCount} initiallyHelpful={liked.has(answer.id)} signedIn={Boolean(identity)} canReact={Boolean(identity && identity.id !== answer.authorId)} comments={commentsByAnswer.get(answer.id) ?? []} />
        <ForumPostActions target={{ target_type: "answer", target_id: answer.id }} questionId={questionId} body={answer.body} canManage={canManage} canReport={canReport} />
      </div>
    </article>;
  })}</div>;
}
