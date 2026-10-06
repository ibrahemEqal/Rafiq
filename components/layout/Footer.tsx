import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto relative overflow-hidden [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
      {/* زخرفة خلفية ناعمة */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        
        <div className="flex items-center gap-3 opacity-90 transition-opacity hover:opacity-100">
          <Image src="/brand/rafeeq-logo.webp" alt="" width={38} height={39} sizes="38px" className="size-10 rounded-full" />
          <span className="text-xl font-black text-slate-800">Rafeeq</span>
        </div>

        <p className="text-sm font-medium text-slate-400">
          {t("rights")}
        </p>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-400">
          <Link href="/terms" className="transition-colors hover:text-blue-600">{t("terms")}</Link>
          <Link href="/privacy" className="transition-colors hover:text-blue-600">{t("privacy")}</Link>
          <Link href="/copyright" className="transition-colors hover:text-blue-600">{t("copyright")}</Link>
          <a href="https://www.instagram.com/rafeeq_nnu/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-pink-600">{t("instagram")} @rafeeq_nnu</a>
        </nav>
      </div>
    </footer>
  );
}
