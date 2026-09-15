import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FileText, Clock, User, ArrowRight } from "lucide-react";
import { oneRelation } from "@/lib/data/relations";
import { Link } from "@/i18n/routing";
import DownloadButton from "@/components/resources/DownloadButton";

export default async function ResourceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [t, locale, resolvedParams, supabase] = await Promise.all([getTranslations("Resources"), getLocale(), params, createClient()]);

  const { data: resource } = await supabase
    .from("resources")
    .select(`
      id, title, type, file_size, download_count, view_count, created_at,
      courses (name_ar, name_en),
      profiles!resources_uploader_id_fkey (full_name)
    `)
    .eq("id", resolvedParams.id)
    .single();

  if (!resource) notFound();
  const course = oneRelation(resource.courses);
  const profile = oneRelation(resource.profiles);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // تنسيق التاريخ
  const uploadDate = new Date(resource.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: "UTC"
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* زر العودة */}
        <Link href="/resources" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-medium mb-8 transition-colors">
          <ArrowRight size={18} />
          العودة للمصادر
        </Link>

        {/* بطاقة التفاصيل */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col md:flex-row gap-8 items-start justify-between bg-gradient-to-br from-white to-slate-50">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-lg uppercase tracking-wider">
                  {resource.type}
                </span>
                {course && (
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 text-sm font-bold rounded-lg">
                    {locale === "ar" ? course.name_ar : course.name_en}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                {resource.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  <span>{profile?.full_name || t("owner")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-slate-400" />
                  <span>{uploadDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-slate-400" />
                  <span dir="ltr">{formatSize(resource.file_size)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8 text-center w-full md:w-auto border-b md:border-b-0 md:border-e border-slate-100 pb-8 md:pb-0 md:pe-12">
              <div>
                <p className="text-3xl font-extrabold text-slate-900 mb-1">{resource.download_count}</p>
                <p className="text-sm font-medium text-slate-500">{t("downloads")}</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 mb-1">{resource.view_count}</p>
                <p className="text-sm font-medium text-slate-500">{t("views")}</p>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <DownloadButton 
                resourceId={resource.id} 
                buttonText={t("download")} 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
