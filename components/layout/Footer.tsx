import { useTranslations } from "next-intl";
import { Library } from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto relative overflow-hidden [content-visibility:auto] [contain-intrinsic-size:auto_180px]">
      {/* زخرفة خلفية ناعمة */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        
        <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
          <div className="bg-slate-100 text-teal-700 p-2 rounded-lg">
            <Library size={20} />
          </div>
          <span className="text-xl font-bold text-slate-700">رفيق</span>
        </div>

        <p className="text-sm font-medium text-slate-400">
          {t("rights")}
        </p>

        <div className="flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-teal-600 transition-colors">الشروط والأحكام</a>
          <a href="#" className="hover:text-teal-600 transition-colors">سياسة الخصوصية</a>
          <a href="#" className="hover:text-teal-600 transition-colors">تواصل معنا</a>
        </div>
      </div>
    </footer>
  );
}
