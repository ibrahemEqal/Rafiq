"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { mutateStudy } from "@/lib/actions/study";
import { safeMaterialUrl, type StudyMaterial } from "@/lib/study/validation";
import { ExternalLink, Trash2, Plus } from "lucide-react";

export default function Materials({ setId, materials, editable }: { setId: string; materials: StudyMaterial[]; editable: boolean }) {
  const t = useTranslations("Study"); const router = useRouter(); const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError(null);
    try {
      const result = await mutateStudy("addMaterial", { set_id: setId, title: form.get("title"), url: form.get("url") });
      if ("error" in result) setError(t(`errors.${result.error}`)); else { formRef.current?.reset(); router.refresh(); }
    } catch { setError(t("errors.failed")); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !window.confirm(t("confirmDeleteMaterial"))) return;
    setBusy(true); setError(null);
    try {
      const result = await mutateStudy("deleteMaterial", { id, set_id: setId });
      if ("error" in result) setError(t(`errors.${result.error}`)); else router.refresh();
    } catch { setError(t("errors.failed")); } finally { setBusy(false); }
  }
  return <section className="rounded-3xl border border-line bg-paper p-5 sm:p-6">
    <h2 className="text-xl font-bold text-ink">{t("materials")}</h2><p className="mb-5 mt-2 text-sm leading-7 text-muted">{t("materialsHint")}</p>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    {materials.length ? <ul className="mb-5 space-y-2">{materials.map(item => <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
      {safeMaterialUrl(item.url) ? item.url.startsWith("/") ? <Link href={item.url} className="min-w-0 break-words text-sm font-bold text-forest hover:underline">{item.title}</Link> : <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 break-words text-sm font-bold text-forest hover:underline"><span>{item.title}</span><ExternalLink size={14} aria-hidden="true" className="shrink-0" /><span className="sr-only">{t("newTab")}</span></a> : <span className="text-sm text-muted">{item.title}</span>}
      {editable && <button type="button" disabled={busy} onClick={() => remove(item.id)} aria-label={t("removeNamedMaterial", { title: item.title })} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} aria-hidden="true" /></button>}
    </li>)}</ul> : <p className="mb-5 text-sm text-muted">{t("noMaterials")}</p>}
    {editable && <form ref={formRef} onSubmit={submit} className="space-y-3 border-t border-line-soft pt-5"><fieldset disabled={busy || materials.length >= 100} className="space-y-3 disabled:opacity-60">
      <label htmlFor="material-title" className="block text-sm font-bold">{t("materialTitle")}</label><input id="material-title" name="title" required minLength={2} maxLength={160} className="w-full rounded-xl border border-line bg-canvas p-3 outline-none focus:border-forest" />
      <label htmlFor="material-url" className="block text-sm font-bold">{t("materialUrl")}</label><input id="material-url" name="url" required maxLength={1200} dir="ltr" placeholder="https://…" className="w-full rounded-xl border border-line bg-canvas p-3 outline-none focus:border-forest" />
      <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage-soft px-4 py-3 text-sm font-bold text-ink hover:bg-sage-soft"><Plus size={16} aria-hidden="true" />{t(busy ? "saving" : "addMaterial")}</button>
    </fieldset>{materials.length >= 100 && <p className="text-xs text-muted">{t("materialsLimit")}</p>}</form>}
  </section>;
}
