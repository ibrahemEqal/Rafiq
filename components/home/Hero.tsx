import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ArrowRight,
  Sun,
  Clock3,
  Check,
  Users,
  Wallet,
  Layers,
  Sparkles,
  ArrowUpLeft,
} from "lucide-react";
export default function Hero({ locale }: { locale: string }) {
  const t = useTranslations("HomePage");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  return (
    <section className="relative overflow-hidden bg-[#f6f5ef] pb-12 pt-8 sm:pb-20 sm:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 top-12 size-[500px] rounded-full bg-[#e0e9d3]/70 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d5dfcb] bg-[#eaf0e2] px-3.5 py-2 text-xs font-bold text-[#496441]">
            <Sparkles size={14} aria-hidden="true" />
            {t("heroBadge")}
          </p>
          <h1 className="text-[2.6rem] font-bold leading-[1.4] tracking-tight text-[#1c3c2e] sm:text-6xl sm:leading-[1.35]">
            <span className="block">{t("heroTitlePrefix")}</span>
            <span className="block text-[#889a61]">{t("heroTitleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-9 text-[#7c8576] sm:text-lg">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/companion"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#244834] px-7 py-4 text-sm font-bold text-white shadow-[0_8px_0_-4px_#b7c6a2] transition hover:-translate-y-0.5 hover:bg-[#183e2c]"
            >
              {t("ctaDay")}
              <Arrow size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/circles"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d9dece] bg-paper/70 px-6 py-4 text-sm font-bold text-[#4d6247]"
            >
              <Users size={18} aria-hidden="true" />
              {t("ctaCircles")}
            </Link>
          </div>
          <p className="mt-4 text-xs leading-7 text-[#8c9485]">
            {t("tryWithoutAccount")}
          </p>
          <div className="mt-9 border-t border-[#dde3d4] pt-6">
            <p className="mb-3 text-xs font-bold text-[#7b8c6f]">
              {t("startFromFeeling")}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ["/companion?moment=free", "feelingFree", Clock3],
                ["/companion?moment=overwhelmed", "feelingBusy", Layers],
                ["/circles", "feelingCompany", Users],
                ["/companion?tab=wallet", "feelingBudget", Wallet],
              ].map(([href, key, Icon]) => {
                const Symbol = Icon as typeof Sun;
                return (
                  <Link
                    key={String(key)}
                    href={String(href)}
                    className="companion-moment border border-white"
                  >
                    <Symbol size={14} aria-hidden="true" />
                    {t(String(key))}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[540px] pb-7">
          <div
            aria-hidden="true"
            className="absolute inset-x-6 bottom-1 top-7 rotate-3 rounded-[2.4rem] bg-[#dfe7ce]"
          />
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[#dce3d2] bg-[#fffefa] shadow-[0_24px_75px_-45px_#526843]">
            <div className="flex items-center justify-between border-b border-[#edf0e5] px-5 py-4">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#304f35]">
                <Image
                  src="/brand/rafeeq-logo.webp"
                  alt={t("logoAlt")}
                  width={30}
                  height={31}
                  sizes="30px"
                  preload
                  className="size-8 rounded-full"
                />
                Rafeeq.
              </span>
              <span className="rounded-full bg-[#f0f3e9] px-3 py-1.5 text-[10px] font-bold text-[#82916e]">
                {t("dayPreview")}
              </span>
            </div>
            <div className="p-5 sm:p-7">
              <p className="text-xs font-bold text-[#97a182]">
                {t("previewGreeting")}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-9 text-[#30492f]">
                {t("previewTitle")}
              </h2>
              <div className="my-5 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-[#eaf0e0] p-4">
                <div>
                  <p className="text-xs text-[#76866c]">{t("previewNext")}</p>
                  <p className="mt-1 text-sm font-bold text-[#344e2d]">
                    {t("previewClass")}
                  </p>
                </div>
                <Sun size={29} aria-hidden="true" className="text-[#8b9d66]" />
              </div>
              <div className="space-y-3">
                {["previewTask1", "previewTask2", "previewTask3"].map(
                  (key, index) => (
                    <Link
                      href="/companion"
                      key={key}
                      className="flex items-center gap-3 rounded-xl border border-[#edf0e5] px-3 py-3.5 text-sm text-[#56634b]"
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${index === 0 ? "border-[#7f9762] bg-[#7f9762] text-white" : "border-[#d3ddc8]"}`}
                      >
                        {index === 0 && <Check size={13} aria-hidden="true" />}
                      </span>
                      {t(key)}
                    </Link>
                  ),
                )}
              </div>
              <Link
                href="/companion"
                className="mt-5 flex items-center justify-between rounded-2xl bg-[#173f33] px-4 py-5 text-white"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-200/75">
                    {t("previewFocus")}
                  </span>
                  <p className="mt-1 text-sm font-bold">
                    {t("previewFocusTitle")}
                  </p>
                </div>
                <span dir="ltr" className="font-mono text-2xl">
                  25:00
                </span>
              </Link>
            </div>
          </div>
          <Link
            href="/companion?tab=capsules"
            className="absolute -bottom-1 end-3 inline-flex items-center gap-2 rounded-full border border-[#e6dece] bg-[#f8ead6] px-4 py-3 text-[11px] font-bold text-[#8d7050] shadow-sm"
          >
            {t("capsuleSticker")}
            <ArrowUpLeft size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
