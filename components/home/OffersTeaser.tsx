import { getTranslations } from "next-intl/server";
import { ArrowUpLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function OffersTeaser({ locale }: { locale: string }) {
  const t = await getTranslations("Offers");
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;
  return <section className="bg-slate-50 px-4 py-8 sm:py-12">
    <Link href="/offers" className="group mx-auto flex max-w-6xl flex-col gap-5 rounded-3xl border border-lime-200 bg-[#edf3df] p-6 transition hover:border-lime-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-start gap-4"><span className="rounded-2xl bg-white p-3 text-violet-700"><Sparkles size={26} aria-hidden="true" /></span><div><span className="text-sm font-bold text-violet-700">{t("soon")}</span><h2 className="mt-1 text-2xl font-black text-slate-950">{t("bannerTitle")}</h2><p className="mt-2 text-base leading-7 text-slate-600">{t("bannerHint")}</p></div></div>
      <span className="inline-flex shrink-0 items-center gap-2 text-base font-bold text-slate-800">{t("peek")}<Arrow size={21} aria-hidden="true" /></span>
    </Link>
  </section>;
}
