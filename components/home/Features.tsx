import { useTranslations } from "next-intl";
import { BookOpen, Library, MessageCircleQuestion } from "lucide-react";

export default function Features() {
  const t = useTranslations("HomePage");

  const features = [
    {
      icon: BookOpen,
      titleKey: "featureResourcesTitle",
      descKey: "featureResourcesDesc",
      gradient: "from-teal-500 to-emerald-500",
    },
    {
      icon: Library,
      titleKey: "featureBooksTitle",
      descKey: "featureBooksDesc",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: MessageCircleQuestion,
      titleKey: "featureCommunityTitle",
      descKey: "featureCommunityDesc",
      gradient: "from-indigo-500 to-purple-500",
    },
  ] as const;

  return (
    <section className="py-32 bg-slate-50 relative border-t border-slate-200/60 [content-visibility:auto] [contain-intrinsic-size:auto_700px]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">{t("featuresTitle")}</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">كل ما تحتاجه في منصة واحدة مصممة خصيصاً لتسهيل حياتك الجامعية.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="group relative flex flex-col p-8 sm:p-10 rounded-[2.5rem] bg-white border border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden"
              >
                {/* تأثير الإضاءة عند المرور */}
                <div className={`absolute -top-24 -end-24 w-48 h-48 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-700 pointer-events-none`}></div>
                
                <div className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
                  <Icon size={28} strokeWidth={2} />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{t(feature.titleKey)}</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  {t(feature.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
