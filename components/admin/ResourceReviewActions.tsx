"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Check, X, Download, RotateCcw, ShieldOff, LoaderCircle } from "lucide-react";
import { moderateResource, createAdminPreview } from "@/lib/actions/admin";
import type { ResourceStatus, AdminError } from "@/lib/admin/resource-review";

export default function ResourceReviewActions({ resourceId, status }: {
  resourceId: string;
  status: ResourceStatus;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AdminError | null>(null);

  async function review(nextStatus: ResourceStatus) {
    if (busy) return;
    if ((nextStatus === "rejected" || nextStatus === "removed") && !window.confirm(t("confirmReview"))) return;
    setBusy(true);
    setError(null);
    try {
      const result = await moderateResource({ resourceId, expectedStatus: status, status: nextStatus });
      if ("error" in result) {
        setError(result.error);
        if (result.error === "conflict") router.refresh();
      }
      // Success is re-rendered in the action response via revalidatePath.
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadForReview() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await createAdminPreview(resourceId);
      if ("error" in result) setError(result.error);
      else window.location.assign(result.url);
    } catch {
      setError("previewFailed");
    } finally {
      setBusy(false);
    }
  }

  const buttonStyle = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-50";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={downloadForReview} className={`${buttonStyle} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
          <Download size={16} />{t("inspect")}
        </button>
        {status === "pending" && <>
          <button type="button" disabled={busy} onClick={() => review("approved")} className={`${buttonStyle} bg-teal-600 text-white hover:bg-teal-700`}>
            <Check size={16} />{t("approve")}
          </button>
          <button type="button" disabled={busy} onClick={() => review("rejected")} className={`${buttonStyle} bg-red-50 text-red-700 hover:bg-red-100`}>
            <X size={16} />{t("reject")}
          </button>
        </>}
        {status === "approved" && <button type="button" disabled={busy} onClick={() => review("removed")} className={`${buttonStyle} bg-red-50 text-red-700 hover:bg-red-100`}>
          <ShieldOff size={16} />{t("remove")}
        </button>}
        {(status === "rejected" || status === "removed") && <button type="button" disabled={busy} onClick={() => review("pending")} className={`${buttonStyle} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
          <RotateCcw size={16} />{t("requeue")}
        </button>}
        {busy && <span role="status" className="inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />{t("working")}</span>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{t(`errors.${error}`)}</p>}
    </div>
  );
}
