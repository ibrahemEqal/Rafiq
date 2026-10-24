import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { StudySet } from "@/lib/study/validation";
import ClientMessages from "@/components/shared/ClientMessages";
import SetForm from "./SetForm";
import CardEditor from "./CardEditor";
import Materials from "./Materials";
import ShareLink from "./ShareLink";
import { ArrowRight, BookOpen, Layers, LockKeyhole, Play, Settings2, Share2 } from "lucide-react";

export default async function SetWorkspace({ set, editable, token }: { set: StudySet; editable: boolean; token?: string }) {
  const [t, locale] = await Promise.all([getTranslations("Study"), getLocale()]);
  const base = token ? `/study/shared/${token}` : `/study/${set.id}`;
  return <div className="min-h-screen bg-canvas px-4 py-7 sm:px-6 sm:py-10"><div className="mx-auto max-w-6xl">
    <Link href="/study" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-forest"><ArrowRight size={16} aria-hidden="true" className={locale === "en" ? "rotate-180" : undefined} />{t("mySets")}</Link>
    <header className="rounded-[2rem] bg-forest p-6 text-white sm:p-9">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-2 text-xs font-bold text-mist">{set.visibility === "shared" ? <Share2 size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}{t(set.visibility === "shared" ? "shared" : "private")}</p>
      {set.subject && <p dir="auto" className="mb-2 text-sm font-bold text-mist">{set.subject}</p>}
      <h1 dir="auto" className="break-words text-3xl font-bold leading-tight sm:text-4xl">{set.title}</h1>
      {set.description && <p dir="auto" className="mt-4 max-w-3xl whitespace-pre-wrap break-words text-sm leading-8 text-mist">{set.description}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-xl bg-paper/10 px-3 py-2 text-sm"><Layers size={16} aria-hidden="true" />{t("cardCount", { count: set.cards.length })}</span><span className="inline-flex items-center gap-2 rounded-xl bg-paper/10 px-3 py-2 text-sm"><BookOpen size={16} aria-hidden="true" />{t("materialCount", { count: set.materials.length })}</span>{set.cards.length > 0 && <Link href={`${base}/review`} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-sage px-5 py-3 text-sm font-bold text-ink hover:bg-sage"><Play size={17} aria-hidden="true" />{t("reviewCards")}</Link>}</div>
      {!editable && <p className="mt-5 text-xs leading-6 text-mist">{t("readOnly")}</p>}
    </header>
    <ClientMessages namespace="Study"><>
      {editable && <div className="mt-5 grid items-start gap-4 sm:grid-cols-2">
        <details className="rounded-2xl border border-line bg-paper p-4"><summary className="flex cursor-pointer items-center gap-2 text-sm font-bold"><Settings2 size={17} aria-hidden="true" />{t("setSettings")}</summary><div className="mt-5"><SetForm set={{ id: set.id, title: set.title, subject: set.subject, description: set.description, visibility: set.visibility }} /></div></details>
        {set.visibility === "shared" && set.share_token && <ShareLink key={set.share_token} token={set.share_token} />}
      </div>}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {editable && <section className="rounded-3xl border border-line bg-paper p-5 sm:p-6"><h2 className="mb-5 text-xl font-bold">{t("newCard")}</h2>{set.cards.length < 300 ? <CardEditor setId={set.id} /> : <p className="text-sm text-muted">{t("cardsLimit")}</p>}</section>}
        <section className="rounded-3xl border border-line bg-paper p-5 sm:p-6"><h2 className="mb-5 text-xl font-bold">{t("cards")}</h2>
          {set.cards.length ? <ol className="space-y-3">{set.cards.map((card, index) => <li key={card.id}><details className="rounded-2xl border border-line bg-canvas p-4"><summary className="cursor-pointer break-words text-base font-bold leading-8 text-ink"><span className="me-2 text-xs text-forest">{index + 1}.</span><span dir="auto">{card.front}</span></summary><div className="mt-4 border-t border-line pt-4">{editable ? <CardEditor setId={set.id} card={card} /> : <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-8 text-ink">{card.back}</p>}</div></details></li>)}</ol> : <p className="rounded-2xl border border-dashed border-line p-6 text-sm leading-7 text-muted">{t(editable ? "noCardsOwner" : "noCards")}</p>}
        </section>
      </div>
      <aside className="min-w-0 space-y-5">
        <Materials setId={set.id} materials={set.materials} editable={editable} />
      </aside>
    </div></></ClientMessages>
  </div></div>;
}
