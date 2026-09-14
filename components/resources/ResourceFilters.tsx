"use client";

import { useTranslations } from "next-intl";

type College = {
  id: string | number;
  name_ar: string;
};

export default function ResourceFilters({ colleges }: { colleges: College[] }) {
  const t = useTranslations("Resources");

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">{t("filters")}</h3>
        <button className="text-sm text-slate-400 hover:text-teal-600 transition-colors font-medium">
          {t("clearFilters")}
        </button>
      </div>

      <div className="space-y-6">
        {/* فلتر نوع الملف */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t("fileType")}</h4>
          <div className="space-y-2">
            {(['all', 'summaries', 'exams', 'lectures'] as const).map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="type" 
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300"
                  defaultChecked={type === 'all'} 
                />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                  {t(type)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t("colleges")}</h4>
          <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block p-3 outline-none">
            <option value="">{t("all")}</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>{college.name_ar}</option>
            ))}
          </select>
        </div>


      </div>
    </div>
  );
}