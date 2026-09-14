import { useTranslations } from "next-intl";
import { FileText, Download, Eye, Clock } from "lucide-react";
import { Link } from "@/i18n/routing";

interface ResourceType {
  id: string;
  title: string;
  type: string; 
  file_size: number;
  download_count: number;
  view_count: number;
  created_at: string;
  courses?: { name_ar: string; name_en: string }[] | null;
  profiles?: { full_name: string }[] | null;
}

export default function ResourceCard({ resource }: { resource: ResourceType }) {
  const t = useTranslations("Resources");
  const course = resource.courses?.[0];
  const profile = resource.profiles?.[0];

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-slate-300 transition-all duration-300">
      
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
            <FileText size={18} />
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
            {resource.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Clock size={14} />
          <span>{new Date(resource.created_at).toLocaleDateString('ar-EG')}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
          {resource.title}
        </h3>
        
        {course && (
          <p className="text-sm font-medium text-teal-600 mb-4 bg-teal-50 w-max px-2.5 py-1 rounded-md">
            {course.name_ar}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-500">
          <span className="font-medium truncate max-w-[120px]">
            {profile?.full_name || t("owner")}
          </span>
          <span className="font-medium bg-slate-100 px-2 py-1 rounded-md">
            {formatSize(resource.file_size)}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 group-hover:bg-teal-50 transition-colors">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
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
          className="text-teal-600 hover:text-teal-800 font-bold text-sm flex items-center gap-1 transition-colors"
        >
          {t("download")} &rarr;
        </Link>
      </div>

    </div>
  );
}