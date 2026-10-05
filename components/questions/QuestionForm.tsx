"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createQuestion } from "@/lib/actions/questions";
import type { QuestionError } from "@/lib/questions/validation";
import { Send, LoaderCircle } from "lucide-react";
import CoursePicker from "@/components/catalog/CoursePicker";
import type { CatalogOption } from "@/lib/catalog/types";

export default function QuestionForm({ colleges }: { colleges: CatalogOption[] }) {
  const t = useTranslations("Questions");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<QuestionError | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || submitted) return;
    setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await createQuestion({ title: data.get("title"), body: data.get("body"), course_id: data.get("course_id") || null });
      if ("error" in result) setError(result.error);
      else { setSubmitted(true); router.push(`/questions/${result.id}`); }
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  const fieldStyle = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:opacity-60";
  return <form onSubmit={submit} className="space-y-6">
    <div><label htmlFor="question-title" className="mb-2 block text-sm font-bold">{t("formTitle")}</label>
      <input id="question-title" name="title" required minLength={5} maxLength={160} disabled={busy || submitted} aria-describedby="question-hint" className={fieldStyle} /></div>
    <CoursePicker colleges={colleges} locale={locale} label={t("course")} emptyLabel={t("general")} disabled={busy || submitted} />
    <div><label htmlFor="question-body" className="mb-2 block text-sm font-bold">{t("formBody")}</label>
      <textarea id="question-body" name="body" rows={8} required minLength={10} maxLength={8000} disabled={busy || submitted} aria-describedby="question-hint" className={`${fieldStyle} resize-y`} />
      <p id="question-hint" className="mt-2 text-xs leading-6 text-slate-500">{t("questionHint")}</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{t(`errors.${error}`)}</p>}
    <button type="submit" disabled={busy || submitted} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">
      {busy || submitted ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}{busy || submitted ? t("posting") : t("publish")}
    </button>
  </form>;
}
