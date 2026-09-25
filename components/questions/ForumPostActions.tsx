"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { deleteForumPost, reportForumPost, updateAnswer } from "@/lib/actions/questions";
import type { ForumTarget, QuestionError } from "@/lib/questions/validation";
import { Edit3, Flag, LoaderCircle, Save, Trash2, X } from "lucide-react";

export default function ForumPostActions({ target, questionId, body, canManage, canReport }: {
  target: ForumTarget;
  questionId: string;
  body?: string;
  canManage: boolean;
  canReport: boolean;
}) {
  const t = useTranslations("Questions");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState<QuestionError | null>(null);
  const [reported, setReported] = useState(false);

  async function remove() {
    if (busy || !window.confirm(t(target.target_type === "question" ? "confirmDeleteQuestion" : "confirmDeleteAnswer"))) return;
    setBusy(true); setError(null);
    try {
      const result = await deleteForumPost(target);
      if ("error" in result) setError(result.error);
      else if (target.target_type === "question") router.replace("/questions");
      else setEditing(false);
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  async function saveAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const value = new FormData(event.currentTarget).get("body");
    setBusy(true); setError(null);
    try {
      const result = await updateAnswer({ answer_id: target.target_id, body: value });
      if ("error" in result) setError(result.error);
      else setEditing(false);
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const reason = new FormData(event.currentTarget).get("reason");
    setBusy(true); setError(null);
    try {
      const result = await reportForumPost({ ...target, reason });
      if ("error" in result) setError(result.error);
      else { setReported(true); setReporting(false); }
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  if (!canManage && !canReport) return null;
  const button = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-wait disabled:opacity-50";

  return <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
    <div className="flex flex-wrap gap-2">
      {canManage && target.target_type === "question" && <Link href={`/questions/${questionId}/edit`} className={`${button} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Edit3 size={14} />{t("edit")}</Link>}
      {canManage && target.target_type === "answer" && <button type="button" disabled={busy} onClick={() => { setEditing(value => !value); setReporting(false); setError(null); }} className={`${button} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Edit3 size={14} />{t("edit")}</button>}
      {canManage && <button type="button" disabled={busy} onClick={remove} className={`${button} bg-red-50 text-red-700 hover:bg-red-100`}><Trash2 size={14} />{t("delete")}</button>}
      {canReport && !reported && <button type="button" disabled={busy} onClick={() => { setReporting(value => !value); setEditing(false); setError(null); }} className={`${button} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Flag size={14} />{t("report")}</button>}
      {busy && <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle size={14} className="animate-spin" />{t("working")}</span>}
    </div>

    {editing && target.target_type === "answer" && <form onSubmit={saveAnswer} className="space-y-3">
      <label htmlFor={`edit-${target.target_id}`} className="sr-only">{t("editAnswer")}</label>
      <textarea id={`edit-${target.target_id}`} name="body" defaultValue={body} minLength={2} maxLength={8000} required disabled={busy} rows={5} className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500" />
      <div className="flex gap-2"><button disabled={busy} className={`${button} bg-teal-600 text-white`}><Save size={14} />{t("save")}</button><button type="button" disabled={busy} onClick={() => setEditing(false)} className={`${button} bg-slate-100 text-slate-700`}><X size={14} />{t("cancel")}</button></div>
    </form>}

    {reporting && <form onSubmit={submitReport} className="space-y-3 rounded-xl bg-amber-50 p-4">
      <label htmlFor={`report-${target.target_id}`} className="block text-xs font-bold text-amber-900">{t("reportReason")}</label>
      <textarea id={`report-${target.target_id}`} name="reason" minLength={10} maxLength={1000} required disabled={busy} rows={4} placeholder={t("reportPlaceholder")} className="w-full resize-y rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500" />
      <div className="flex gap-2"><button disabled={busy} className={`${button} bg-amber-700 text-white`}><Flag size={14} />{t("sendReport")}</button><button type="button" disabled={busy} onClick={() => setReporting(false)} className={`${button} bg-white text-slate-700`}><X size={14} />{t("cancel")}</button></div>
    </form>}
    {reported && <p role="status" className="text-xs font-semibold text-teal-700">{t("reportSuccess")}</p>}
    {error && <p role="alert" className="text-xs text-red-700">{t(`errors.${error}`)}</p>}
  </div>;
}
