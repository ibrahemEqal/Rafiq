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
import { UploadCloud, CheckCircle2, Link2, FileUp } from "lucide-react";

type ResourceOption = {
  id: string;
  name_ar: string;
  name_en: string;
};

type SourceType = "upload" | "external";

export default function UploadForm({ colleges, userId }: { colleges: ResourceOption[]; userId: string }) {
  const t = useTranslations("Resources");
  const locale = useLocale();
  const router = useRouter();

  const [sourceType, setSourceType] = useState<SourceType>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [majors, setMajors] = useState<ResourceOption[]>([]);
  const [courses, setCourses] = useState<(ResourceOption & { code: string })[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const supabase = createClient();
  const optionName = (option: ResourceOption) => locale === "ar" ? option.name_ar : option.name_en;
  const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50";
  const labelClass = "mb-2 block text-base font-bold text-slate-800";

  const loadCatalog = async (kind: "college" | "major", value: string) => {
    if (!value) { if (kind === "college") setMajors([]); setCourses([]); return; }
    setCatalogLoading(true);
    setFormError(null);
    try {
      const key = kind === "college" ? "college_id" : "major_id";
      const response = await fetch(`/api/catalog?${key}=${encodeURIComponent(value)}`);
      if (!response.ok) throw new Error();
      const payload = await response.json();
      if (kind === "college") { setMajors(payload.majors ?? []); setCourses([]); }
      else setCourses(payload.courses ?? []);
    } catch {
      setFormError(locale === "ar" ? "تعذّر تحميل الدليل الأكاديمي." : "The academic catalog could not be loaded.");
    } finally { setCatalogLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    let payload;

    if (sourceType === "upload") {
      if (!file) {
        setFormError(locale === "ar" ? "اختر ملفًا أولًا." : "Choose a file first.");
        return;
      }
      const metadata = getResourceFileMetadata(file.name);
      if (!metadata) {
        setFormError(locale === "ar" ? "الملفات المسموحة: PDF، DOC، DOCX، ZIP فقط." : "Only PDF, DOC, DOCX and ZIP files are supported.");
        return;
      }
      const filePath = `${userId}/${crypto.randomUUID()}.${metadata.extension}`;
      payload = {
        source_type: "upload" as const,
        title: formData.get("title"),
        type: formData.get("type"),
        college_id: formData.get("college_id"),
        course_id: formData.get("course_id"),
        storage_path: filePath,
        file_size: file.size,
        mime_type: metadata.mimeType,
      };
    } else {
      payload = {
        source_type: "external" as const,
        title: formData.get("title"),
        type: formData.get("type"),
        college_id: formData.get("college_id"),
        course_id: formData.get("course_id"),
        external_url: externalUrl,
        storage_path: null,
        file_size: null,
        mime_type: null,
      };
    }

    const parsed = resourceSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(formatResourceValidationError(parsed.error));
      return;
    }

    setLoading(true);
    try {
      if (parsed.data.source_type === "upload") {
        const uploadData = parsed.data;
        const { error: uploadError } = await supabase.storage
          .from("resources")
          .upload(uploadData.storage_path, file!, {
            cacheControl: "31536000",
            contentType: uploadData.mime_type,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const result = await createResourceRecord(uploadData);
        if (!result.success) {
          const { error: cleanupError } = await supabase.storage.from("resources").remove([uploadData.storage_path]);
          const cleanupMessage = cleanupError
            ? (locale === "ar" ? "\nتعذّر حذف الملف غير المسجّل من التخزين." : "\nThe unsaved upload could not be removed from storage.")
            : "";
          setFormError((result.error ?? "") + cleanupMessage);
          return;
        }
      } else {
        const result = await createResourceRecord(parsed.data);
        if (!result.success) {
          setFormError(result.error ?? (locale === "ar" ? "تعذّر حفظ الرابط." : "Could not save the link."));
          return;
        }
      }

      setSuccess(true);
      router.push("/resources");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (locale === "ar" ? "حدث خطأ أثناء النشر." : "Publishing failed.");
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-teal-600">
        <CheckCircle2 size={64} className="mb-4" />
        <h3 className="text-2xl font-bold">{t("uploadSuccess")}</h3>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div>
        <label className={labelClass}>{t("fileTitle")}</label>
        <input type="text" name="title" required minLength={3} maxLength={160} className={fieldClass} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className={labelClass}>{t("selectCollege")}</label>
          <select name="college_id" required onChange={(event) => loadCatalog("college", event.target.value)} className={fieldClass}>
            <option value="">...</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{optionName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t("selectMajor")}</label>
          <select name="major_id" required disabled={!majors.length || catalogLoading} onChange={(event) => loadCatalog("major", event.target.value)} className={fieldClass}>
            <option value="">...</option>
            {majors.map(major => <option key={major.id} value={major.id}>{optionName(major)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t("selectCourse")}</label>
          <select name="course_id" required disabled={!courses.length || catalogLoading} className={fieldClass}>
            <option value="">...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {optionName(c)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("fileType")}</label>
        <select name="type" required className={fieldClass}>
          <option value="summary">{locale === "ar" ? "ملخص" : "Summary"}</option>
          <option value="previous_exam">{locale === "ar" ? "امتحان سابق" : "Past exam"}</option>
          <option value="lecture">{locale === "ar" ? "محاضرة" : "Lecture"}</option>
          <option value="assignment">{locale === "ar" ? "واجب" : "Assignment"}</option>
          <option value="notes">{locale === "ar" ? "ملاحظات" : "Notes"}</option>
          <option value="other">{locale === "ar" ? "أخرى" : "Other"}</option>
        </select>
      </div>

      <fieldset>
        <legend className={labelClass}>{t("sourceType")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setSourceType("upload")} className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-start text-base font-bold transition ${sourceType === "upload" ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-700"}`}>
            <FileUp size={22} />{t("uploadFileOption")}
          </button>
          <button type="button" onClick={() => setSourceType("external")} className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-start text-base font-bold transition ${sourceType === "external" ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-700"}`}>
            <Link2 size={22} />{t("driveLinkOption")}
          </button>
        </div>
      </fieldset>

      {sourceType === "upload" ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center transition-colors hover:bg-slate-50">
          <input
            type="file"
            id="file"
            accept=".pdf,.doc,.docx,.zip"
            required
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="file" className="flex cursor-pointer flex-col items-center">
            <UploadCloud size={44} className="mb-3 text-teal-500" />
            <span className="text-base font-semibold text-slate-700">{file ? file.name : t("chooseFile")}</span>
            {file && <span className="mt-2 text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
          </label>
        </div>
      ) : (
        <div>
          <label htmlFor="external_url" className={labelClass}>{t("driveLinkLabel")}</label>
          <input
            id="external_url"
            type="url"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            required
            dir="ltr"
            placeholder="https://drive.google.com/..."
            className={fieldClass}
          />
          <p className="mt-2 text-sm leading-6 text-slate-500">{t("driveLinkHint")}</p>
        </div>
      )}

      {formError && (
        <p role="alert" className="whitespace-pre-line rounded-xl bg-red-50 p-4 text-base text-red-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-teal-700 disabled:opacity-70"
      >
        {loading ? <span className="animate-pulse">{t("uploading")}</span> : t("submitUpload")}
      </button>
    </form>
  );
}
