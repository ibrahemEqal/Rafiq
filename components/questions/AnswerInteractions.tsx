"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { createAnswerComment, deleteAnswerComment, setAnswerReaction } from "@/lib/actions/questions";
import type { QuestionError } from "@/lib/questions/validation";
import { LoaderCircle, MessageCircle, Send, ThumbsUp, Trash2 } from "lucide-react";

type CommentView = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  canDelete: boolean;
};

export default function AnswerInteractions({
  answerId,
  initialHelpfulCount,
  initiallyHelpful,
  signedIn,
  canReact,
  comments,
}: {
  answerId: string;
  initialHelpfulCount: number;
  initiallyHelpful: boolean;
  signedIn: boolean;
  canReact: boolean;
  comments: CommentView[];
}) {
  const t = useTranslations("Questions");
  const router = useRouter();
  const [helpful, setHelpful] = useState(initiallyHelpful);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<QuestionError | null>(null);

  async function toggleHelpful() {
    if (busy) return;
    if (!signedIn) { setError("unauthorized"); return; }
    if (!canReact) { setError("forbidden"); return; }
    const next = !helpful;
    setHelpful(next);
    setHelpfulCount(value => Math.max(0, value + (next ? 1 : -1)));
    setBusy(true);
    setError(null);
    try {
      const result = await setAnswerReaction({ answer_id: answerId, active: next });
      if ("error" in result) {
        setHelpful(!next);
        setHelpfulCount(value => Math.max(0, value + (next ? -1 : 1)));
        setError(result.error);
      }
    } catch {
      setHelpful(!next);
      setHelpfulCount(value => Math.max(0, value + (next ? -1 : 1)));
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const body = new FormData(form).get("body");
    setBusy(true);
    setError(null);
    try {
      const result = await createAnswerComment({ answer_id: answerId, body });
      if ("error" in result) setError(result.error);
      else { form.reset(); router.refresh(); }
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  async function removeComment(commentId: string) {
    if (busy || !window.confirm(t("confirmDeleteComment"))) return;
    setDeleting(commentId);
    setError(null);
    try {
      const result = await deleteAnswerComment({ comment_id: commentId });
      if ("error" in result) setError(result.error);
      else router.refresh();
    } catch { setError("failed"); }
    finally { setDeleting(null); }
  }

  return <div className="mt-6 border-t border-slate-100 pt-4">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={toggleHelpful} disabled={busy} aria-pressed={helpful} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${helpful ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200" : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`}>
        {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ThumbsUp size={17} className={helpful ? "fill-current" : ""} />}{t("helpful")}<span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{helpfulCount}</span>
      </button>
      <button type="button" onClick={() => { setOpen(value => !value); setError(null); }} aria-expanded={open} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition ${open ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700"}`}>
        <MessageCircle size={17} />{t("comments")}<span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{comments.length}</span>
      </button>
      {!canReact && signedIn && <span className="text-xs font-semibold text-slate-400">{t("ownAnswerReaction")}</span>}
    </div>

    {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
      {t(`errors.${error}`)} {error === "unauthorized" && <Link href="/auth/login" className="ms-1 underline">{t("signIn")}</Link>}
    </p>}

    {open && <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 sm:p-5">
      {!comments.length ? <p className="py-2 text-center text-sm text-slate-500">{t("noComments")}</p> : comments.map(comment => <article key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
        <header className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-extrabold text-slate-800">{comment.authorName}</span><div className="flex items-center gap-2"><time className="text-[11px] text-slate-400">{comment.createdAt}</time>{comment.canDelete && <button type="button" onClick={() => removeComment(comment.id)} disabled={Boolean(deleting)} aria-label={t("deleteComment")} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">{deleting === comment.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>}</div></header>
        <p dir="auto" className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{comment.body}</p>
      </article>)}

      {signedIn ? <form onSubmit={addComment} className="flex items-end gap-2 pt-2">
        <div className="min-w-0 flex-1"><label htmlFor={`comment-${answerId}`} className="sr-only">{t("addComment")}</label><textarea id={`comment-${answerId}`} name="body" required minLength={2} maxLength={1000} rows={2} disabled={busy} placeholder={t("commentPlaceholder")} className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></div>
        <button type="submit" disabled={busy} aria-label={t("sendComment")} className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}</button>
      </form> : <p className="pt-2 text-sm text-slate-500">{t("loginToComment")} <Link href="/auth/login" className="font-extrabold text-sky-700 underline">{t("signIn")}</Link></p>}
    </div>}
  </div>;
}
