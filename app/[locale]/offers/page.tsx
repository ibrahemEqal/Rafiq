import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpLeft, ArrowUpRight, BriefcaseBusiness, ChevronDown, LockKeyhole, NotebookPen, Sparkles, Ticket, Wrench } from "lucide-react";
import { Link } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Offers" });
  return { title: `${t("title")} | Rafeeq`, description: t("description") };
}

export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Offers");
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;
  const categories = [
    { key: "stationery", icon: NotebookPen },
    { key: "workshops", icon: Wrench },
    { key: "work", icon: BriefcaseBusiness },
  ] as const;

  return <section className="relative isolate overflow-hidden bg-[#f3f5ee] px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
    <div aria-hidden="true" className="pointer-events-none absolute -end-36 -top-40 -z-10 h-[35rem] w-[35rem] rounded-full bg-lime-200/40 blur-3xl" />
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
        <span className="h-px w-10 bg-slate-400" aria-hidden="true" />{t("eyebrow")}
      </div>
      <div className="mt-9 grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-base font-bold text-violet-800"><Sparkles size={18} aria-hidden="true" />{t("soon")}</span>
          <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.25] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{t("headline")}<span className="mt-2 block text-violet-700">{t("headlineAccent")}</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-9 text-slate-600">{t("description")}</p>
          <p className="mt-5 text-base font-bold text-slate-800">{t("promise")}</p>
          <Link href="/resources" className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 py-3 text-base font-bold text-white transition hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700">{t("explore")}<Arrow size={20} aria-hidden="true" /></Link>
        </div>

        <div className="relative mx-auto w-full max-w-md pb-6 pt-5">
          <div aria-hidden="true" className="absolute inset-x-5 bottom-0 top-8 rotate-[-5deg] rounded-[2rem] border border-violet-200 bg-violet-200/60" />
          <div className="relative overflow-hidden rounded-[2rem] bg-[#23183e] p-6 text-white shadow-2xl shadow-violet-950/20 sm:p-9">
            <div className="flex items-center justify-between gap-4 text-sm font-bold text-violet-200"><span>RAFEEQ / {t("ticketLabel")}</span><Ticket size={25} aria-hidden="true" /></div>
            <div className="relative my-9 flex h-28 items-center justify-center" aria-hidden="true">
              <span className="absolute size-28 rounded-full border border-white/15" />
              <span className="absolute size-20 rounded-full bg-lime-300/10" />
              <LockKeyhole size={36} className="relative text-lime-300" strokeWidth={1.5} />
              <span className="absolute end-6 top-0 text-3xl text-lime-300">✦</span>
              <span className="absolute bottom-0 start-6 text-xl text-violet-300">✦</span>
            </div>
            <p className="text-center text-3xl font-black leading-normal sm:text-4xl">{t("ticketHeadline")}</p>
            <p className="mx-auto mt-3 max-w-xs text-center text-base leading-8 text-violet-200">{t("ticketHint")}</p>
            <div className="relative -mx-6 my-7 border-t-2 border-dashed border-white/20 sm:-mx-9" aria-hidden="true"><span className="absolute -start-3 -top-3 size-6 rounded-full bg-[#f3f5ee]" /><span className="absolute -end-3 -top-3 size-6 rounded-full bg-[#f3f5ee]" /></div>
            <div className="flex items-center justify-between gap-3"><span className="text-sm text-violet-200">{t("ticketFooter")}</span><span className="rounded-full bg-lime-300 px-4 py-1.5 text-base font-black text-slate-950">{t("soon")}</span></div>
          </div>
        </div>
      </div>

      <details className="group mt-12 rounded-3xl border border-slate-200 bg-white/80 sm:mt-16">
        <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-5 text-lg font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700 sm:px-8 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-3"><Sparkles size={21} className="shrink-0 text-violet-600" aria-hidden="true" />{t("peek")}</span><ChevronDown size={22} className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary>
        <div className="border-t border-slate-200 px-6 pb-7 pt-5 sm:px-8">
          <p className="mb-5 text-base leading-8 text-slate-600">{t("peekHint")}</p>
          <div className="grid gap-3 sm:grid-cols-3">{categories.map(({ key, icon: Icon }) => <div key={key} className="rounded-2xl border border-slate-200 bg-[#f8f9f5] p-5"><Icon size={25} className="mb-3 text-violet-700" aria-hidden="true" /><h2 className="text-lg font-bold text-slate-900">{t(`categories.${key}`)}</h2></div>)}</div>
          <p className="mt-5 text-sm leading-7 text-slate-500">{t("noOffers")}</p>
        </div>
      </details>
      <p className="mt-7 text-center text-base font-medium text-slate-500">{t("closing")}</p>
    </div>
  </section>;
}
