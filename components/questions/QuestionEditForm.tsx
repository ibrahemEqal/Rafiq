"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { updateQuestion } from "@/lib/actions/questions";
import type { QuestionError } from "@/lib/questions/validation";
import { LoaderCircle, Save } from "lucide-react";

export default function QuestionEditForm({ question, courses }: {
  question: { id: string; title: string; body: string; course_id: string | null };
  courses: { id: string; name_ar: string; name_en: string }[];
}) {
  const t = useTranslations("Questions");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<QuestionError | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      const result = await updateQuestion({ question_id: question.id, title: data.get("title"), body: data.get("body"), course_id: data.get("course_id") || null });
      if ("error" in result) setError(result.error);
      else router.replace(`/questions/${question.id}`);
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500 disabled:opacity-60";
  return <form onSubmit={submit} className="space-y-6">
    <div><label htmlFor="edit-question-title" className="mb-2 block text-sm font-bold">{t("formTitle")}</label><input id="edit-question-title" name="title" defaultValue={question.title} minLength={5} maxLength={160} required disabled={busy} className={field} /></div>
    <div><label htmlFor="edit-question-course" className="mb-2 block text-sm font-bold">{t("course")}</label><select id="edit-question-course" name="course_id" defaultValue={question.course_id ?? ""} disabled={busy} className={field}><option value="">{t("general")}</option>{courses.map(course => <option key={course.id} value={course.id}>{locale === "ar" ? course.name_ar : course.name_en}</option>)}</select></div>
    <div><label htmlFor="edit-question-body" className="mb-2 block text-sm font-bold">{t("formBody")}</label><textarea id="edit-question-body" name="body" defaultValue={question.body} rows={9} minLength={10} maxLength={8000} required disabled={busy} className={`${field} resize-y`} /></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{t(`errors.${error}`)}</p>}
    <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-50">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}{busy ? t("working") : t("save")}</button>
  </form>;
}
