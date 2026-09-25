"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HandHeart, LoaderCircle, MessageCircleHeart } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { createRequestResponse } from "@/lib/actions/requests";
import type { RequestActionError } from "@/lib/requests/validation";

export default function ResponseForm({ requestId }: { requestId: string }) {
  const t = useTranslations("Requests");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<RequestActionError | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;
    setBusy(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = await createRequestResponse({
        request_id: requestId,
        body: data.get("body"),
        whatsapp_number: data.get("whatsapp_number"),
      });
      if ("error" in result) setError(result.error ?? "failed");
      else {
        form.reset();
        setDone(true);
        router.refresh();
      }
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60";
  return <form onSubmit={submit} className="space-y-5">
    <div className="flex items-start gap-3">
      <span className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><HandHeart size={22} /></span>
      <div><h2 className="font-extrabold text-slate-900">{t("canHelp")}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t("responseSubtitle")}</p></div>
    </div>
    <div>
      <label htmlFor="response-body" className="mb-2 block text-sm font-bold text-slate-700">{t("responseBody")}</label>
      <textarea id="response-body" name="body" required minLength={2} maxLength={1000} rows={5} disabled={busy || done} placeholder={t("responsePlaceholder")} className={`${field} resize-y`} />
    </div>
    <div>
      <label htmlFor="response-whatsapp" className="mb-2 block text-sm font-bold text-slate-700">{t("whatsappOptional")}</label>
      <input id="response-whatsapp" name="whatsapp_number" type="tel" inputMode="tel" maxLength={20} disabled={busy || done} placeholder="+970 59 000 0000" className={field} />
      <p className="mt-2 text-xs leading-6 text-slate-500">{t("privacyHint")}</p>
    </div>
    {done && <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{t("responseSuccess")}</p>}
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{t(`errors.${error}`)}</p>}
    <button type="submit" disabled={busy || done} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
      {busy ? <LoaderCircle size={18} className="animate-spin" /> : <MessageCircleHeart size={18} />}{busy ? t("sendingResponse") : t("sendResponse")}
    </button>
  </form>;
}
