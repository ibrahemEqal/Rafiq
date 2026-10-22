"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { mutateStudy } from "@/lib/actions/study";
import type { StudyCard } from "@/lib/study/validation";
import { Plus, Save, Trash2 } from "lucide-react";

export default function CardEditor({ setId, card }: { setId: string; card?: StudyCard }) {
  const t = useTranslations("Study"); const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const prefix = card?.id ?? "new-card";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError(null); setSaved(false);
    try {
      const result = await mutateStudy(card ? "updateCard" : "addCard", { ...(card ? { id: card.id } : {}), set_id: setId, front: form.get("front"), back: form.get("back") });
      if ("error" in result) setError(t(`errors.${result.error}`));
      else { if (!card) formRef.current?.reset(); setSaved(true); router.refresh(); }
    } catch { setError(t("errors.failed")); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (busy || !card || !window.confirm(t("confirmDeleteCard"))) return;
    setBusy(true); setError(null);
    try {
      const result = await mutateStudy("deleteCard", { id: card.id, set_id: setId });
      if ("error" in result) setError(t(`errors.${result.error}`)); else router.refresh();
    } catch { setError(t("errors.failed")); }
    finally { setBusy(false); }
  }
  return <form ref={formRef} onSubmit={submit} className="space-y-4">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {saved && <p role="status" className="text-sm font-bold text-teal-700">{t("cardSaved")}</p>}
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      <div><label htmlFor={`${prefix}-front`} className="mb-2 block text-sm font-bold">{t("front")}</label><textarea id={`${prefix}-front`} name="front" defaultValue={card?.front} required maxLength={800} rows={2} placeholder={t("frontExample")} className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-teal-500" /></div>
      <div><label htmlFor={`${prefix}-back`} className="mb-2 block text-sm font-bold">{t("back")}</label><textarea id={`${prefix}-back`} name="back" defaultValue={card?.back} required maxLength={2000} rows={3} placeholder={t("backExample")} className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-teal-500" /></div>
      <div className="flex flex-wrap gap-3"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">{card ? <Save size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{t(busy ? "saving" : card ? "saveCard" : "addCard")}</button>{card && <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"><Trash2 size={16} aria-hidden="true" />{t("deleteCard")}</button>}</div>
    </fieldset>
  </form>;
}
