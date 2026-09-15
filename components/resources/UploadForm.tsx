"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { createResourceRecord } from "@/lib/actions/resources";
import {
  resourceSchema,
  getResourceFileMetadata,
  formatResourceValidationError,
} from "@/lib/validation/resource";
import { UploadCloud, CheckCircle2 } from "lucide-react";

type ResourceOption = {
  id: string;
  name_ar: string;
};

export default function UploadForm({ colleges, courses, userId }: { colleges: ResourceOption[]; courses: ResourceOption[]; userId: string }) {
  const t = useTranslations("Resources");
  const locale = useLocale();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    if (!file) {
      setFormError(locale === "ar" ? "اختر ملفًا أولًا." : "Choose a file first.");
      return;
    }
    const metadata = getResourceFileMetadata(file.name);
    if (!metadata) {
      setFormError(locale === "ar" ? "الملفات المسموحة: PDF، DOC، DOCX، ZIP فقط." : "Only PDF, DOC, DOCX and ZIP files are supported.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const filePath = `${userId}/${crypto.randomUUID()}.${metadata.extension}`;
    const parsed = resourceSchema.safeParse({
      title: formData.get("title"),
      type: formData.get("type"),
      college_id: formData.get("college_id"),
      course_id: formData.get("course_id"),
      storage_path: filePath,
      file_size: file.size,
      mime_type: metadata.mimeType,
    });
    if (!parsed.success) {
      setFormError(formatResourceValidationError(parsed.error));
      return;
    }

    setLoading(true);

    try {
      // 1. رفع الملف مباشرة إلى Storage بأداء عالٍ
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file, { cacheControl: '31536000', contentType: metadata.mimeType, upsert: false });

      if (uploadError) throw uploadError;


      // حفظ سجل موثوق في قاعدة البيانات بعد نجاح الرفع
      const result = await createResourceRecord(parsed.data);

      if (result.success) {
        setSuccess(true);
        router.push("/resources");
        router.refresh();
      } else {
        const { error: cleanupError } = await supabase.storage.from("resources").remove([filePath]);
        const cleanupMessage = cleanupError
          ? (locale === "ar" ? "\nتعذّر حذف الملف غير المسجّل من التخزين." : "\nThe unsaved upload could not be removed from storage.")
          : "";
        setFormError(result.error + cleanupMessage);
      }
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (locale === "ar" ? "حدث خطأ أثناء الرفع." : "Upload failed.");
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-teal-600">
        <CheckCircle2 size={64} className="mb-4" />
        <h3 className="text-xl font-bold">{t("uploadSuccess")}</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("fileTitle")}</label>
        <input type="text" name="title" required minLength={3} maxLength={160} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t("selectCollege")}</label>
          <select name="college_id" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white">
            <option value="">...</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t("selectCourse")}</label>
          <select name="course_id" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white">
            <option value="">...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("fileType")}</label>
        <select name="type" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white">
          <option value="summary">ملخص</option>
          <option value="previous_exam">امتحان سابق</option>
          <option value="lecture">محاضرة</option>
        </select>
      </div>

      {/* منطقة سحب وإفلات الملف المبسطة */}
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
        <input 
          type="file" 
          id="file"
          accept=".pdf,.doc,.docx,.zip"
          required 
          className="hidden" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
          <UploadCloud size={40} className="text-teal-500 mb-3" />
          <span className="text-slate-600 font-medium">
            {file ? file.name : t("chooseFile")}
          </span>
          {file && <span className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
        </label>
      </div>

      {formError && (
        <p role="alert" className="whitespace-pre-line rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </p>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl shadow-md hover:bg-teal-700 disabled:opacity-70 transition-all flex justify-center items-center gap-2"
      >
        {loading ? <span className="animate-pulse">{t("uploading")}</span> : t("submitUpload")}
      </button>
    </form>
  );
}
