import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";
import { FileText, Clock, User, ArrowRight, Link2 } from "lucide-react";
import { oneRelation } from "@/lib/data/relations";
import { Link } from "@/i18n/routing";
import DownloadButton from "@/components/resources/DownloadButton";

export default async function ResourceDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale === "en" ? "en" : "ar";
  setRequestLocale(locale);
  const t = await getTranslations("Resources");
  const supabase = createPublicClient();

  const { data: resource } = await supabase
    .from("resources")
    .select(`
      id, title, type, source_type, file_size, download_count, view_count, created_at,
      courses (name_ar, name_en),
      profiles!resources_uploader_id_fkey (full_name)
    `)
    .eq("id", resolvedParams.id)
    .eq("status", "approved")
    .single();

  if (!resource) notFound();
  const course = oneRelation(resource.courses);
  const profile = oneRelation(resource.profiles);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return null;
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const uploadDate = new Date(resource.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <Link href="/resources" className="mb-8 inline-flex items-center gap-2 text-base font-medium text-slate-600 transition-colors hover:text-teal-600">
          <ArrowRight size={18} />
          {t("backToResources")}
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-start justify-between gap-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50 p-8 md:flex-row md:p-12">
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-bold uppercase tracking-wider text-indigo-700">
                  {resource.type}
                </span>
                {course && (
                  <span className="rounded-lg bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
                    {locale === "ar" ? course.name_ar : course.name_en}
                  </span>
                )}
                {resource.source_type === "external" && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                    <Link2 size={15} />{t("externalResource")}
                  </span>
                )}
              </div>
              <h1 className="mb-6 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                {resource.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-base font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  <span>{profile?.full_name || t("owner")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-slate-400" />
                  <span>{uploadDate}</span>
                </div>
                {resource.source_type === "upload" && (
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    <span dir="ltr">{formatSize(resource.file_size)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-8 p-8 md:flex-row md:p-12">
            <div className="flex w-full items-center gap-8 border-b border-slate-100 pb-8 text-center md:w-auto md:border-b-0 md:border-e md:pb-0 md:pe-12">
              <div>
                <p className="mb-1 text-3xl font-extrabold text-slate-900">{resource.download_count}</p>
                <p className="text-base font-medium text-slate-500">{t("downloads")}</p>
              </div>
              <div>
                <p className="mb-1 text-3xl font-extrabold text-slate-900">{resource.view_count}</p>
                <p className="text-base font-medium text-slate-500">{t("views")}</p>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <DownloadButton resourceId={resource.id} buttonText={resource.source_type === "external" ? t("openDrive") : t("download")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
