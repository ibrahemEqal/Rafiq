import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

export default function Hero({ locale }: { locale: string }) {
  const t = useTranslations("HomePage");
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const highlights = [t("heroOrganized"), t("heroCommunity"), t("heroAccess")];

  return (
    <section className="relative isolate overflow-hidden bg-[#05091f] text-white">
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,235,0.32),transparent_31%),radial-gradient(circle_at_82%_24%,rgba(124,58,237,0.28),transparent_30%),linear-gradient(145deg,#040718_0%,#081334_55%,#05091f_100%)]" />
      <div className="absolute inset-0 -z-20 opacity-25 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:linear-gradient(to_bottom,#000_20%,transparent_92%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#f6f8fc] to-transparent" />

      <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:gap-10 lg:px-10 lg:py-28">
        <div className="relative z-10 flex flex-col items-start text-start">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.07] px-4 py-2 text-sm font-bold text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
            <Sparkles size={16} className="text-amber-300" aria-hidden="true" />
            <span>{t("heroBadge")}</span>
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[1.08] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl xl:text-[5rem]">
            <span className="block">{t("heroTitlePrefix")}</span>
            <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent rtl:bg-gradient-to-l">
              {t("heroTitleAccent")}
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-300 sm:text-xl sm:leading-9">
            {t("heroSubtitle")}
          </p>

          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/resources"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-base font-extrabold text-[#071333] shadow-[0_16px_45px_-18px_rgba(103,232,249,0.7)] transition duration-300 hover:-translate-y-1 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              <Search size={20} aria-hidden="true" />
              <span>{t("ctaExplore")}</span>
              <ArrowIcon size={18} className="opacity-60 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
            </Link>

            <Link
              href="/questions"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-7 py-4 text-base font-extrabold text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              <UsersRound size={20} aria-hidden="true" />
              <span>{t("ctaAsk")}</span>
            </Link>
          </div>

          <div className="mt-10 grid w-full gap-3 border-t border-white/10 pt-7 sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-2.5 text-sm font-semibold leading-6 text-slate-300">
                <CheckCircle2 size={17} className="mt-1 shrink-0 text-cyan-300" aria-hidden="true" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[580px] lg:justify-self-end">
          <div className="absolute inset-[12%] rounded-full bg-blue-500/25 blur-[70px]" />
          <div className="absolute -inset-5 rounded-[3.5rem] border border-white/[0.06]" />
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_35px_100px_-40px_rgba(37,99,235,0.7)] backdrop-blur-sm sm:p-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_12%,rgba(250,204,21,0.09),transparent_25%),radial-gradient(circle_at_15%_80%,rgba(34,211,238,0.13),transparent_30%)]" />
            <Image
              src="/brand/rafeeq-logo.png"
              alt={t("logoAlt")}
              width={620}
              height={634}
              sizes="(max-width: 640px) 82vw, (max-width: 1024px) 520px, 560px"
              preload
              className="relative z-10 h-auto w-full drop-shadow-[0_30px_35px_rgba(0,0,0,0.32)]"
            />
          </div>

          <div className="absolute -end-3 top-[12%] hidden items-center gap-3 rounded-2xl border border-white/15 bg-[#0b1739]/90 px-4 py-3 text-start shadow-2xl backdrop-blur-xl sm:flex lg:-end-8">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-300 text-[#071333]">
              <GraduationCap size={21} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-bold text-slate-400">{t("heroCardCatalogLabel")}</span>
              <span className="mt-0.5 block text-sm font-black text-white">{t("heroCardCatalog")}</span>
            </span>
          </div>

          <div className="absolute -start-3 bottom-[10%] hidden items-center gap-3 rounded-2xl border border-white/15 bg-white/95 px-4 py-3 text-start text-[#071333] shadow-2xl backdrop-blur-xl sm:flex lg:-start-8">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
              <UsersRound size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-bold text-slate-500">{t("heroCardCommunityLabel")}</span>
              <span className="mt-0.5 block text-sm font-black">{t("heroCardCommunity")}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
