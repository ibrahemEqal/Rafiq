"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createBookRecord } from "@/lib/actions/books";
import { BookOpen, Copy, LoaderCircle, Send } from "lucide-react";

type College = { id: string; name_ar: string; name_en: string };

export default function AddBookForm({ colleges }: { colleges: College[] }) {
  const t = useTranslations("Books");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("book");
  const [error, setError] = useState<string | null>(null);
  const fieldClass = "w-full rounded-xl border border-line bg-canvas px-4 py-3.5 text-base text-ink outline-none transition focus:border-forest focus:bg-paper focus:ring-4 focus:ring-sage-soft";
  const labelClass = "mb-2 block text-sm font-bold text-ink";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("type", type);
    try {
      const result = await createBookRecord(formData);
      if (result.success) { router.push("/books"); router.refresh(); }
      else setError(t(result.error === "invalid" ? "invalidBook" : result.error === "unauthorized" ? "loginRequired" : "publishFailed"));
    } catch { setError(t("publishFailed")); }
    finally { setLoading(false); }
  };

  return <form onSubmit={handleSubmit} className="space-y-6">
    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">{error}</p>}
    <fieldset disabled={loading} className="space-y-6 disabled:opacity-70">
      <legend className={labelClass}>{t("listingType")}</legend>
      <div className="grid grid-cols-2 gap-3">
        {[["book", "bookType"], ["printed_slides", "slidesType"]].map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 p-3 text-sm font-bold transition ${type === value ? "border-forest bg-sage-soft text-forest" : "border-line bg-paper text-muted hover:border-line"}`}>
          {value === "book" ? <BookOpen size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}{t(label)}
        </button>)}
      </div>
      <div><label htmlFor="listing-title" className={labelClass}>{t("formTitle")}</label><input id="listing-title" type="text" name="title" required minLength={2} maxLength={160} placeholder={t("titleExample")} className={fieldClass} /></div>
      <div><label htmlFor="listing-college" className={labelClass}>{t("formCollege")}</label><select id="listing-college" name="college_id" required className={fieldClass}><option value="">{t("chooseCollege")}</option>{colleges.map(college => <option key={college.id} value={college.id}>{locale === "ar" ? college.name_ar : college.name_en}</option>)}</select></div>
      <div><label htmlFor="listing-whatsapp" className={labelClass}>{t("formWhatsapp")}</label><input id="listing-whatsapp" type="tel" name="whatsapp_number" autoComplete="tel" dir="ltr" maxLength={25} placeholder={t("whatsappPlaceholder")} required aria-describedby="listing-whatsapp-hint" className={fieldClass} /><p id="listing-whatsapp-hint" className="mt-2 text-xs leading-6 text-muted">{t("whatsappHint")}</p></div>
      <div><label htmlFor="listing-description" className={labelClass}>{t("formDesc")}</label><textarea id="listing-description" name="description" rows={4} maxLength={2000} placeholder={t("descriptionExample")} className={`${fieldClass} resize-y`} /></div>
      <p className="rounded-xl bg-sage-soft p-4 text-sm leading-7 text-forest">{t("publishHint")}</p>
      <button type="submit" disabled={loading} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-4 font-bold text-white hover:bg-forest-hover disabled:cursor-wait">
        {loading ? <LoaderCircle size={19} aria-hidden="true" className="animate-spin" /> : <Send size={19} aria-hidden="true" />}{t(loading ? "submitting" : "submitBook")}
      </button>
    </fieldset>
  </form>;
}
