import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  HandHelping,
  LibraryBig,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";

export default function Features({ locale }: { locale: string }) {
  const t = useTranslations("HomePage");
  const ArrowIcon = locale === "ar" ? ArrowLeft : ArrowRight;

  const features = [
    {
      href: "/resources" as const,
      icon: BookOpenCheck,
      title: t("featureResourcesTitle"),
      description: t("featureResourcesDesc"),
      className: "bg-[#071333] text-white lg:col-span-7",
      iconClassName: "bg-gradient-to-br from-cyan-300 to-blue-500 text-[#071333]",
      descriptionClassName: "text-slate-300",
      linkClassName: "text-cyan-300",
      glowClassName: "bg-blue-500/20",
    },
    {
      href: "/books" as const,
      icon: LibraryBig,
      title: t("featureBooksTitle"),
      description: t("featureBooksDesc"),
      className: "bg-white text-slate-950 lg:col-span-5",
      iconClassName: "bg-amber-100 text-amber-700",
      descriptionClassName: "text-slate-600",
      linkClassName: "text-amber-700",
      glowClassName: "bg-amber-300/20",
    },
    {
      href: "/questions" as const,
      icon: MessageCircleQuestion,
      title: t("featureCommunityTitle"),
      description: t("featureCommunityDesc"),
      className: "bg-white text-slate-950 lg:col-span-5",
      iconClassName: "bg-violet-100 text-violet-700",
      descriptionClassName: "text-slate-600",
      linkClassName: "text-violet-700",
      glowClassName: "bg-violet-300/20",
    },
    {
      href: "/requests" as const,
      icon: HandHelping,
      title: t("featureRequestsTitle"),
      description: t("featureRequestsDesc"),
      className: "bg-gradient-to-br from-blue-600 to-violet-700 text-white lg:col-span-7",
      iconClassName: "bg-white/15 text-white ring-1 ring-white/20",
      descriptionClassName: "text-blue-100",
      linkClassName: "text-white",
      glowClassName: "bg-cyan-300/20",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#f6f8fc] py-24 sm:py-28 [content-visibility:auto] [contain-intrinsic-size:auto_1200px]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700">
            <Sparkles size={15} aria-hidden="true" />
            <span>{t("featuresEyebrow")}</span>
          </div>
          <h2 className="text-4xl font-black tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-6xl">
            {t("featuresTitle")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
            {t("featuresSubtitle")}
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className={`group relative min-h-[310px] overflow-hidden rounded-[2rem] border border-slate-200/70 p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.3)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_-38px_rgba(30,64,175,0.4)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 sm:p-10 ${feature.className}`}
              >
                <div className={`absolute -end-20 -top-20 size-64 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-125 ${feature.glowClassName}`} />
                <div className="relative z-10 flex h-full flex-col items-start">
                  <span className={`flex size-14 items-center justify-center rounded-2xl shadow-sm transition duration-500 group-hover:-rotate-3 group-hover:scale-110 ${feature.iconClassName}`}>
                    <Icon size={27} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <h3 className="mt-9 text-2xl font-black tracking-tight sm:text-3xl">{feature.title}</h3>
                  <p className={`mt-4 max-w-xl text-base font-medium leading-8 sm:text-lg ${feature.descriptionClassName}`}>
                    {feature.description}
                  </p>
                  <span className={`mt-auto inline-flex items-center gap-2 pt-8 text-sm font-extrabold ${feature.linkClassName}`}>
                    {t("featureLink")}
                    <ArrowIcon size={17} className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="relative mt-20 overflow-hidden rounded-[2.5rem] bg-[#05091f] px-7 py-12 text-white shadow-[0_30px_90px_-45px_rgba(37,99,235,0.65)] sm:px-12 sm:py-14 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_88%_80%,rgba(124,58,237,0.26),transparent_34%)]" />
          <Image
            src="/brand/rafeeq-logo.webp"
            alt=""
            width={250}
            height={256}
            sizes="250px"
            aria-hidden="true"
            className="absolute -bottom-24 -end-10 h-auto w-64 opacity-20 sm:-end-3"
          />
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-extrabold text-cyan-300">{t("finalCtaEyebrow")}</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{t("finalCtaTitle")}</h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-slate-300 sm:text-lg">{t("finalCtaSubtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/resources" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-extrabold text-[#071333] transition hover:-translate-y-0.5 hover:bg-cyan-50">
                {t("finalCtaResources")}
              </Link>
              <Link href="/requests" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] px-6 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.12]">
                {t("finalCtaRequests")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
