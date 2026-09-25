"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { updateRequestStatus } from "@/lib/actions/requests";
import type { RequestActionError } from "@/lib/requests/validation";

export default function RequestStatusActions({ requestId, status }: { requestId: string; status: string }) {
  const t = useTranslations("Requests");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RequestActionError | null>(null);
  const next = status === "open" ? "fulfilled" : "open";

  async function update() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await updateRequestStatus({ request_id: requestId, status: next });
      if ("error" in result) setError(result.error ?? "failed");
      else router.refresh();
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  return <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
    <p className="mb-3 text-xs font-bold leading-6 text-violet-800">{t("ownerHint")}</p>
    <button type="button" onClick={update} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-violet-800 disabled:opacity-60">
      {busy ? <LoaderCircle size={17} className="animate-spin" /> : status === "open" ? <CheckCircle2 size={17} /> : <RotateCcw size={17} />}
      {status === "open" ? t("markFulfilled") : t("reopen")}
    </button>
    {error && <p role="alert" className="mt-3 text-xs font-bold text-red-700">{t(`errors.${error}`)}</p>}
  </div>;
}
