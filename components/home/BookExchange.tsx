import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, BookOpen, HeartHandshake, Plus, Search } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function BookExchange({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "BookExchange" });
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  return <section aria-labelledby="book-exchange-heading" className="bg-canvas px-5 py-10 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-line bg-paper">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="p-6 sm:p-10 lg:p-12">
          <p className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3 py-2 text-xs font-bold text-forest"><HeartHandshake size={16} aria-hidden="true" />{t("badge")}</p>
          <h2 id="book-exchange-heading" className="mt-5 max-w-xl text-3xl font-bold leading-relaxed text-ink sm:text-4xl">{t("title")}</h2>
          <p className="mt-4 max-w-xl text-sm leading-8 text-muted sm:text-base">{t("description")}</p>
          <form action={locale === "en" ? "/en/books" : "/books"} method="get" className="mt-6 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="home-book-search" className="sr-only">{t("searchLabel")}</label>
            <input id="home-book-search" type="search" name="q" maxLength={80} placeholder={t("searchPlaceholder")} className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage-soft" />
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-forest-hover"><Search size={17} aria-hidden="true" />{t("search")}</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/books" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-sage-soft px-4 py-3 text-sm font-bold text-forest">{t("browse")}<Arrow size={16} aria-hidden="true" /></Link>
            <Link href="/books/new" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-bold text-forest hover:bg-canvas"><Plus size={17} aria-hidden="true" />{t("share")}</Link>
          </div>
        </div>
        <div className="flex flex-col justify-center border-t border-line bg-[#edf1e4] p-6 sm:p-10 lg:border-s lg:border-t-0 lg:p-12">
          <div aria-hidden="true" className="mb-7 flex items-end justify-center gap-2">
            <div className="flex h-32 w-16 -rotate-6 items-center justify-center rounded-lg border-s-4 border-[#53735a] bg-[#244834] text-[#e1ebd0] shadow-sm"><BookOpen size={27} /></div>
            <div className="flex h-40 w-20 items-center justify-center rounded-lg border-s-4 border-[#baa16b] bg-[#ddc99c] text-[#635232] shadow-sm"><BookOpen size={32} /></div>
            <div className="flex h-28 w-16 rotate-6 items-center justify-center rounded-lg border-s-4 border-[#8b9c7c] bg-[#b8c8a3] text-[#39553a] shadow-sm"><BookOpen size={25} /></div>
          </div>
          <h3 className="text-center text-xl font-bold text-forest">{t("howTitle")}</h3>
          <ol className="mt-5 space-y-3">
            {(["stepOne", "stepTwo", "stepThree"] as const).map((step, index) => <li key={step} className="flex items-center gap-3 rounded-xl border border-white/70 bg-paper/70 p-3 text-sm leading-7 text-ink"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">{index + 1}</span>{t(step)}</li>)}
          </ol>
          <Link href="/requests/new" className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-bold text-forest underline underline-offset-4">{t("request")}<Arrow size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  </section>;
}
