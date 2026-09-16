"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createAnswer } from "@/lib/actions/questions";
import type { QuestionError } from "@/lib/questions/validation";
import { Send, LoaderCircle } from "lucide-react";

export default function AnswerForm({ questionId, page }: { questionId: string; page: number }) {
  const t = useTranslations("Questions");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<QuestionError | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(null); setSuccess(false);
    try {
      const result = await createAnswer({ question_id: questionId, body: data.get("body") });
      if ("error" in result) setError(result.error);
      else {
        form.reset(); setSuccess(true);
        // Page one is re-rendered in the action response; older pages navigate
        // to the latest answers so the just-posted answer is actually visible.
        if (page > 1) router.replace(`/questions/${questionId}`);
      }
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-4">
    <label htmlFor="answer-body" className="block text-sm font-bold text-slate-900">{t("yourAnswer")}</label>
    <textarea id="answer-body" name="body" rows={5} required minLength={2} maxLength={8000} disabled={busy} aria-describedby="answer-hint" className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:opacity-60" />
    <p id="answer-hint" className="text-xs text-slate-500">{t("answerHint")}</p>
    {error && <p role="alert" className="text-sm text-red-700">{t(`errors.${error}`)}</p>}
    {success && <p role="status" className="text-sm text-teal-700">{t("answerSuccess")}</p>}
    <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">
      {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}{busy ? t("posting") : t("postAnswer")}
    </button>
  </form>;
}
