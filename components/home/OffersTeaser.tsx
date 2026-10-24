import { getTranslations } from "next-intl/server";
import { ArrowUpLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function OffersTeaser({ locale }: { locale: string }) {
  const t = await getTranslations("Offers");
  const Arrow = locale === "ar" ? ArrowUpLeft : ArrowUpRight;
  return <section className="bg-canvas px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/offers" className="group mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-line bg-sand p-6 transition hover:border-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-start gap-4"><span className="shrink-0 rounded-2xl bg-paper p-3 text-forest"><Sparkles size={26} aria-hidden="true" /></span><div><span className="text-sm font-bold text-forest">{t("soon")}</span><h2 className="mt-1 text-2xl font-bold text-ink">{t("bannerTitle")}</h2><p className="mt-2 text-sm leading-7 text-muted">{t("bannerHint")}</p></div></div>
      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-forest">{t("peek")}<Arrow size={21} aria-hidden="true" /></span>
    </Link>
  </section>;
}
