import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, Search, Sparkles } from "lucide-react";

export default function Hero({ locale }: { locale: string }) {
  const t = useTranslations("HomePage");
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="relative pt-32 pb-40 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Background Patterns (Grid + Glow) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-20 opacity-40"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-teal-100/50 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

      <div className="container mx-auto px-4 text-center z-10 relative">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-slate-800 text-sm font-semibold mb-10 shadow-sm">
          <Sparkles size={16} className="text-teal-500" />
          <span>منصة طلاب جامعة النجاح الأولى</span>
        </div>

        {/* Title */}
        <h1 className="animate-fade-in-up animation-delay-100 text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight leading-[1.1] mb-8 max-w-5xl mx-auto text-slate-900">
          رفيقك نحو <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">التفوق</span> الجامعي
        </h1>
        
        {/* Subtitle */}
        <p className="animate-fade-in-up animation-delay-200 text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
          {t("heroSubtitle")}
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/resources"
            className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-full overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Search size={20} className="relative z-10 opacity-90" />
            <span className="relative z-10">{t("ctaExplore")}</span>
          </Link>
          
          <Link
            href="/questions"
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-slate-900 text-lg font-bold rounded-full shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
          >
            <span>{t("ctaAsk")}</span>
            <ArrowIcon size={20} className="opacity-60 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}