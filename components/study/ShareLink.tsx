"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Check, Share2 } from "lucide-react";

export default function ShareLink({ token }: { token: string }) {
  const t = useTranslations("Study"); const locale = useLocale();
  const [copied, setCopied] = useState(false); const [fallback, setFallback] = useState("");
  async function copy() {
    const url = `${window.location.origin}${locale === "en" ? "/en" : ""}/study/shared/${token}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setFallback(""); }
    catch { setFallback(url); }
  }
  return <div className="rounded-2xl border border-line bg-sage-soft p-4">
    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-forest"><Share2 size={17} aria-hidden="true" />{t("sharedNotice")}</p>
    <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-paper px-4 py-2.5 text-sm font-bold text-forest shadow-sm">{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{t(copied ? "linkCopied" : "copyLink")}</button>
    {fallback && <label className="mt-3 block text-xs text-forest">{t("copyManually")}<input readOnly value={fallback} onFocus={event => event.currentTarget.select()} dir="ltr" className="mt-2 w-full rounded-lg border border-line bg-paper p-3 text-sm" /></label>}
  </div>;
}
