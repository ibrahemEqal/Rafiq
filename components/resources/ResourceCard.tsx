import { useLocale, useTranslations } from "next-intl";
import { oneRelation } from "@/lib/data/relations";
import { FileText, Download, Eye, Clock } from "lucide-react";
import { Link } from "@/i18n/routing";

interface ResourceType {
  id: string;
  title: string;
  type: string; 
  file_size: number | null;
  download_count: number;
  view_count: number;
  created_at: string;
  courses?: { name_ar: string; name_en: string } | { name_ar: string; name_en: string }[] | null;
  profiles?: { full_name: string } | { full_name: string }[] | null;
}

export default function ResourceCard({ resource }: { resource: ResourceType }) {
  const t = useTranslations("Resources");
  const locale = useLocale();
  const course = oneRelation(resource.courses);
  const profile = oneRelation(resource.profiles);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return locale === "ar" ? "رابط خارجي" : "External link";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="group flex flex-col bg-paper border border-line rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-line transition-all duration-300">
      
      <div className="p-5 border-b border-line-soft flex items-center justify-between bg-canvas/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sage-soft text-forest rounded-lg">
            <FileText size={18} />
          </div>
          <span className="text-xs font-bold text-forest bg-sage-soft px-2 py-1 rounded-md uppercase tracking-wider">
            {resource.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Clock size={14} />
          <span>{new Date(resource.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { timeZone: "UTC" })}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-ink mb-2 line-clamp-2 group-hover:text-forest transition-colors">
          {resource.title}
        </h3>
        
        {course && (
          <p className="text-sm font-medium text-forest mb-4 bg-sage-soft w-max px-2.5 py-1 rounded-md">
            {locale === "ar" ? course.name_ar : course.name_en}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-muted">
          <span className="font-medium truncate max-w-[120px]">
            {profile?.full_name || t("owner")}
          </span>
          <span className="font-medium bg-sage-soft px-2 py-1 rounded-md">
            {formatSize(resource.file_size)}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-line-soft flex items-center justify-between bg-canvas/50 group-hover:bg-sage-soft transition-colors">
        <div className="flex items-center gap-4 text-xs font-semibold text-muted">
          <div className="flex items-center gap-1.5">
            <Eye size={14} />
            <span>{resource.view_count}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Download size={14} />
            <span>{resource.download_count}</span>
          </div>
        </div>
        
        <Link 
          href={`/resources/${resource.id}`}
          className="text-forest hover:text-forest font-bold text-sm flex items-center gap-1 transition-colors"
        >
          {t("download")} &rarr;
        </Link>
      </div>

    </div>
  );
}
