import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Sun,
  Users,
  Backpack,
  BookOpen,
  LibraryBig,
  MessageCircleQuestion,
  HandHelping,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Wallet,
  Mail,
} from "lucide-react";
export default function Features({ locale }: { locale: string }) {
  const t = useTranslations("HomePage");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const spaces = [
    {
      href: "/companion",
      key: "Day",
      icon: Sun,
      tone: "bg-[#e5edda]",
      span: "lg:col-span-7",
    },
    {
      href: "/circles",
      key: "Circles",
      icon: Users,
      tone: "bg-[#eee6d8]",
      span: "lg:col-span-5",
    },
    {
      href: "/study",
      key: "Study",
      icon: Backpack,
      tone: "bg-[#e9e5f0]",
      span: "lg:col-span-4",
    },
    {
      href: "/books",
      key: "Books",
      icon: BookOpen,
      tone: "bg-[#f0ead9]",
      span: "lg:col-span-4",
    },
    {
      href: "/resources",
      key: "Resources",
      icon: LibraryBig,
      tone: "bg-[#e0eae3]",
      span: "lg:col-span-4",
    },
    {
      href: "/questions",
      key: "Community",
      icon: MessageCircleQuestion,
      tone: "bg-[#e8eaf0]",
      span: "lg:col-span-6",
    },
    {
      href: "/requests",
      key: "Requests",
      icon: HandHelping,
      tone: "bg-[#f1e6dc]",
      span: "lg:col-span-6",
    },
  ];
  return (
    <>
      <section className="bg-[#fffefa] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-10 max-w-3xl">
            <p className="companion-eyebrow">{t("featuresEyebrow")}</p>
            <h2 className="mt-3 text-3xl font-bold leading-relaxed text-[#233f2f] sm:text-4xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-4 text-sm leading-8 text-[#8b9383] sm:text-base">
              {t("featuresSubtitle")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {spaces.map((space) => (
              <Link
                href={space.href}
                key={space.href}
                className={`group relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-black/5 p-6 transition hover:-translate-y-1 hover:shadow-xl sm:p-8 ${space.tone} ${space.span}`}
              >
                <space.icon
                  size={29}
                  aria-hidden="true"
                  className="text-[#617255]"
                />
                <h3 className="mt-6 text-xl font-bold text-[#34442f]">
                  {t(`feature${space.key}Title`)}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-8 text-[#7f8775]">
                  {t(`feature${space.key}Desc`)}
                </p>
                <span className="mt-auto flex items-center gap-2 pt-5 text-xs font-bold text-[#4c6640]">
                  {t("featureLink")}
                  <Arrow size={15} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#f6f5ef] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <h2 className="mb-8 text-center text-3xl font-bold leading-relaxed text-[#2c4432]">
            {t("beyondStudyTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["semester", GraduationCap, "#ece8f0"],
              ["wallet", Wallet, "#ecebdc"],
              ["capsules", Mail, "#f1e6db"],
            ].map(([tab, Icon, tone]) => {
              const Symbol = Icon as typeof Sun;
              return (
                <Link
                  key={String(tab)}
                  href={`/companion?tab=${tab}`}
                  className="companion-paper p-6 sm:p-8"
                >
                  <span
                    className="inline-flex rounded-2xl p-3"
                    style={{ background: String(tone) }}
                  >
                    <Symbol
                      size={25}
                      aria-hidden="true"
                      className="text-[#6c765c]"
                    />
                  </span>
                  <h3 className="mb-3 mt-5 text-lg font-bold text-[#3c5139]">
                    {t(`beyond.${tab}.title`)}
                  </h3>
                  <p className="text-sm leading-8 text-[#8a9280]">
                    {t(`beyond.${tab}.hint`)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-[#f6f5ef] px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#263f32] p-7 text-center sm:p-12">
          <p className="text-xs font-bold text-[#b9cf9b]">
            {t("finalCtaEyebrow")}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-relaxed text-white sm:text-4xl">
            {t("finalCtaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-[#b2c0aa]">
            {t("finalCtaSubtitle")}
          </p>
          <Link
            href="/companion"
            className="mt-7 inline-flex min-h-13 items-center gap-3 rounded-2xl bg-[#d8e6bc] px-7 py-4 text-sm font-bold text-[#2b4933]"
          >
            {t("ctaDay")}
            <Arrow size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
