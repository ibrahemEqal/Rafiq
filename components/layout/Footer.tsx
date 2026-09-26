import Image from "next/image";
import { useTranslations } from "next-intl";

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

        <div className="flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-blue-600 transition-colors">{t("terms")}</a>
          <a href="#" className="hover:text-blue-600 transition-colors">{t("privacy")}</a>
          <a href="#" className="hover:text-blue-600 transition-colors">{t("contact")}</a>
        </div>
      </div>
    </footer>
  );
}
