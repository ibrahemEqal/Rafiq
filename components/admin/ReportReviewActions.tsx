"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { moderateReport } from "@/lib/actions/admin";
import type { AdminError } from "@/lib/admin/resource-review";
import type { ReportStatus } from "@/lib/admin/report-review";

export default function ReportReviewActions({ reportId, status }: { reportId: string; status: ReportStatus }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AdminError | null>(null);

  async function review(next: ReportStatus) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const result = await moderateReport({ reportId, expectedStatus: status, status: next });
      if ("error" in result) {
        setError(result.error);
        if (result.error === "conflict") router.refresh();
      }
    } catch { setError("failed"); }
    finally { setBusy(false); }
  }

  const style = "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-wait disabled:opacity-50";
  return <div className="space-y-3"><div className="flex flex-wrap gap-2">
    {status === "pending" ? <><button disabled={busy} onClick={() => review("reviewed")} className={`${style} bg-teal-600 text-white`}><Check size={16} />{t("markReviewed")}</button><button disabled={busy} onClick={() => review("dismissed")} className={`${style} bg-slate-100 text-slate-700`}><X size={16} />{t("dismissReport")}</button></> : <button disabled={busy} onClick={() => review("pending")} className={`${style} bg-amber-50 text-amber-800`}><RotateCcw size={16} />{t("reopenReport")}</button>}
    {busy && <span role="status" className="inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />{t("working")}</span>}
  </div>{error && <p role="alert" className="text-sm text-red-700">{t(`errors.${error}`)}</p>}</div>;
}
