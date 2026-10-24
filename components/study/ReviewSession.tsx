"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { reviewStudyCard } from "@/lib/actions/study";
import { reviewQueue, type ReviewMode } from "@/lib/study/review";
import type { StudyCard, StudyReview } from "@/lib/study/validation";
import { Check, RotateCcw, Eye, Layers, Clock3, CircleHelp, LoaderCircle } from "lucide-react";

export default function ReviewSession({ cards, reviews, signedIn, token, now }: { cards: StudyCard[]; reviews: StudyReview[]; signedIn: boolean; token?: string; now: number }) {
  const t = useTranslations("Study");
  const [queue, setQueue] = useState<StudyCard[] | null>(null);
  const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [busy, setBusy] = useState(false);
  const [known, setKnown] = useState(0); const [missed, setMissed] = useState<StudyCard[]>([]); const [error, setError] = useState<string | null>(null);
  function start(mode: ReviewMode, only?: StudyCard[]) {
    setQueue(only ?? reviewQueue(cards, reviews, mode, now)); setIndex(0); setFlipped(false); setKnown(0); setMissed([]); setError(null);
  }
  async function rate(remembered: boolean) {
    if (busy || !flipped || !queue?.[index]) return;
    setBusy(true); setError(null);
    const card = queue[index];
    try {
      if (signedIn) {
        const result = await reviewStudyCard({ card_id: card.id, remembered, token: token ?? null });
        if ("error" in result) { setError(t(`errors.${result.error}`)); return; }
      }
      if (remembered) setKnown(value => value + 1); else setMissed(value => [...value, card]);
      setIndex(value => value + 1); setFlipped(false);
    } catch { setError(t("errors.failed")); } finally { setBusy(false); }
  }
  const due = reviewQueue(cards, reviews, "due", now).length;
  const weak = reviewQueue(cards, reviews, "weak", now).length;
  return <div className="mx-auto max-w-3xl">
    {!signedIn && <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">{t("guestReview")} <Link href="/auth/login" className="font-bold underline">{t("signIn")}</Link></p>}
    {queue === null ? <section className="rounded-3xl border border-line bg-paper p-5 sm:p-8">
      <h2 className="text-2xl font-bold text-ink">{t("chooseReview")}</h2><p className="mb-6 mt-3 text-sm leading-7 text-muted">{t("reviewHint")}</p>
      <div className="grid gap-3 sm:grid-cols-3">{([["all", cards.length, Layers], ["due", due, Clock3], ["weak", weak, CircleHelp]] as const).map(([mode, count, Icon]) => <button key={mode} type="button" disabled={!count} onClick={() => start(mode)} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-canvas p-4 font-bold text-ink transition hover:border-forest hover:bg-sage-soft disabled:cursor-not-allowed disabled:opacity-40"><Icon size={25} aria-hidden="true" className="text-forest" /><span>{t(`mode.${mode}`)}</span><span className="text-sm text-muted">{t("cardCount", { count })}</span></button>)}</div>
      <p className="mt-6 text-xs leading-6 text-muted">{t("scheduleHint")}</p>
    </section> : index >= queue.length ? <section role="status" className="rounded-3xl border border-line bg-paper p-6 text-center sm:p-10">
      <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-sage-soft text-forest"><Check size={30} aria-hidden="true" /></span>
      <h2 className="text-2xl font-bold text-ink">{t(queue.length ? "sessionComplete" : "noReviewCards")}</h2>
      {queue.length > 0 && <><p className="mt-4 text-lg font-bold text-forest">{t("sessionSummary", { known, missed: missed.length })}</p><p className="mt-3 text-sm leading-7 text-muted">{t("selfReported")}</p></>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">{missed.length > 0 && <button type="button" onClick={() => start("weak", missed)} className="rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white">{t("repeatMissed")}</button>}<button type="button" onClick={() => setQueue(null)} className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-bold"><RotateCcw size={16} aria-hidden="true" />{t("newSession")}</button></div>
    </section> : <section aria-label={t("reviewCards")}>
      <div className="mb-3 flex items-center justify-between text-sm font-bold text-muted"><p aria-live="polite">{t("position", { current: index + 1, total: queue.length })}</p><button type="button" disabled={busy} onClick={() => setQueue(null)} className="rounded-lg px-3 py-2 hover:bg-sage-soft">{t("endSession")}</button></div>
      <progress aria-label={t("sessionProgress")} value={index} max={queue.length} className="mb-5 h-2 w-full overflow-hidden rounded-full accent-forest [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-forest" />
      <div className="min-h-72 rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-10">
        <p className="mb-5 text-xs font-bold uppercase tracking-wider text-forest">{t("front")}</p><p dir="auto" className="whitespace-pre-wrap break-words text-xl font-bold leading-9 text-ink sm:text-2xl">{queue[index].front}</p>
        {flipped && <div id="card-answer" className="mt-8 border-t border-line-soft pt-6"><p className="mb-3 text-xs font-bold text-forest">{t("back")}</p><p dir="auto" className="whitespace-pre-wrap break-words text-lg leading-9 text-ink">{queue[index].back}</p></div>}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-700">{error}</p>}
      {!flipped ? <button type="button" onClick={() => setFlipped(true)} aria-expanded={false} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-4 font-bold text-white hover:bg-forest-hover"><Eye size={20} aria-hidden="true" />{t("revealAnswer")}</button> : <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={() => rate(false)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-4 font-bold text-amber-900 disabled:opacity-50">{busy ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}{t("forgot")}</button><button type="button" disabled={busy} onClick={() => rate(true)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-forest px-3 py-4 font-bold text-white disabled:opacity-50"><Check size={18} aria-hidden="true" />{t("remembered")}</button></div>}
    </section>}
  </div>;
}
