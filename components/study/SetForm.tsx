"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { mutateStudy } from "@/lib/actions/study";
import type { StudySet } from "@/lib/study/validation";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";

export default function SetForm({ set }: { set?: Pick<StudySet, "id" | "title" | "subject" | "description" | "visibility"> }) {
  const t = useTranslations("Study");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50";
  const prefix = set ? "edit" : "new";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      const result = await mutateStudy(set ? "updateSet" : "createSet", { ...(set ? { id: set.id } : {}), title: form.get("title"), subject: form.get("subject"), description: form.get("description"), visibility: form.get("shared") === "on" ? "shared" : "private" });
      if ("error" in result) setError(t(`errors.${result.error}`));
      else { router.push(`/study/${result.id}`); router.refresh(); }
    } catch { setError(t("errors.failed")); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy || !set || !window.confirm(t("confirmDeleteSet"))) return;
    setBusy(true); setError(null);
    try {
      const result = await mutateStudy("deleteSet", { id: set.id });
      if ("error" in result) setError(t(`errors.${result.error}`));
      else { router.push("/study"); router.refresh(); }
    } catch { setError(t("errors.failed")); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-7 text-red-700">{error}</p>}
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      <div><label htmlFor={`${prefix}-title`} className="mb-2 block text-sm font-bold">{t("setTitle")}</label><input id={`${prefix}-title`} name="title" defaultValue={set?.title} required minLength={3} maxLength={160} placeholder={t("titleExample")} className={field} /></div>
      <div><label htmlFor={`${prefix}-subject`} className="mb-2 block text-sm font-bold">{t("subject")}</label><input id={`${prefix}-subject`} name="subject" defaultValue={set?.subject} maxLength={120} placeholder={t("subjectExample")} className={field} /></div>
      <div><label htmlFor={`${prefix}-description`} className="mb-2 block text-sm font-bold">{t("description")}</label><textarea id={`${prefix}-description`} name="description" defaultValue={set?.description} maxLength={2000} rows={3} className={field} /></div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4"><input name="shared" type="checkbox" defaultChecked={set?.visibility === "shared"} className="mt-1 size-4 shrink-0 accent-teal-600" /><span><span className="block text-sm font-bold">{t("enableSharing")}</span><span className="mt-1 block text-xs leading-6 text-slate-500">{t("sharingHint")}</span></span></label>
      <div className="flex flex-wrap gap-3"><button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700">{busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : set ? <Save size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}{t(set ? "saveSet" : "createSet")}</button>
      {set && <button type="button" onClick={remove} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"><Trash2 size={16} aria-hidden="true" />{t("deleteSet")}</button>}</div>
    </fieldset>
  </form>;
}
