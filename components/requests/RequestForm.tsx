"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { HandHeart, LoaderCircle, Send } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { createRequest } from "@/lib/actions/requests";
import type { RequestActionError } from "@/lib/requests/validation";

export default function RequestForm({ courses }: { courses: { id: string; name_ar: string; name_en: string }[] }) {
  const t = useTranslations("Requests");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RequestActionError | null>(null);
  const [type, setType] = useState("resource");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await createRequest({
        title: data.get("title"),
        description: data.get("description"),
        type: data.get("type"),
        course_id: data.get("course_id") || null,
      });
      if ("error" in result) setError(result.error ?? "failed");
      else router.push(`/requests/${result.id}`);
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:opacity-60";
  const types = ["book", "resource", "other"] as const;

  return <form onSubmit={submit} className="space-y-7">
    <fieldset disabled={busy}>
      <legend className="mb-3 text-sm font-extrabold text-slate-800">{t("formType")}</legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {types.map(item => <label key={item} className={`cursor-pointer rounded-2xl border p-3 text-center transition sm:p-4 ${type === item ? "border-violet-500 bg-violet-50 text-violet-800 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"}`}>
          <input type="radio" name="type" value={item} checked={type === item} onChange={() => setType(item)} className="sr-only" />
          <span className="text-sm font-extrabold">{t(`types.${item}`)}</span>
        </label>)}
      </div>
    </fieldset>

    <div>
      <label htmlFor="request-title" className="mb-2 block text-sm font-extrabold text-slate-800">{t("formTitle")}</label>
      <input id="request-title" name="title" required minLength={5} maxLength={140} disabled={busy} placeholder={t("titlePlaceholder")} className={field} />
    </div>

    <div>
      <label htmlFor="request-course" className="mb-2 block text-sm font-extrabold text-slate-800">{t("course")}</label>
      <select id="request-course" name="course_id" disabled={busy} className={field}>
        <option value="">{t("general")}</option>
        {courses.map(course => <option key={course.id} value={course.id}>{locale === "ar" ? course.name_ar : course.name_en}</option>)}
      </select>
    </div>

    <div>
      <label htmlFor="request-description" className="mb-2 block text-sm font-extrabold text-slate-800">{t("formDescription")}</label>
      <textarea id="request-description" name="description" required minLength={10} maxLength={2000} rows={7} disabled={busy} placeholder={t("descriptionPlaceholder")} className={`${field} resize-y`} />
      <p className="mt-2 text-xs leading-6 text-slate-500">{t("requestHint")}</p>
    </div>

    {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{t(`errors.${error}`)}</p>}

    <button type="submit" disabled={busy} className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
      {busy ? <LoaderCircle size={19} className="animate-spin" /> : <Send size={19} />}
      {busy ? t("posting") : t("publish")}
    </button>
    <div className="inline-flex items-center gap-2 text-xs text-slate-400 sm:ms-4"><HandHeart size={15} />{t("communityNote")}</div>
  </form>;
}
