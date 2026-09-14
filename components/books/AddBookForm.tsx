"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createBookRecord } from "@/lib/actions/books";
import { BookOpen, Copy, Send } from "lucide-react";

type College = {
  id: string | number;
  name_ar: string;
};

export default function AddBookForm({ colleges }: { colleges: College[] }) {
  const t = useTranslations("Books");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("book"); // الافتراضي: كتاب

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("type", type); // إضافة النوع بناءً على اختيار المستخدم

    try {
      const result = await createBookRecord(formData);
      if (result.success) {
        router.push("/books");
      } else {
        alert("حدث خطأ أثناء الإضافة.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* اختيار النوع بأزرار أنيقة بدلاً من قائمة منسدلة */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setType("book")}
          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${type === 'book' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
        >
          <BookOpen size={20} />
          {t("bookType")}
        </button>
        <button
          type="button"
          onClick={() => setType("printed_slides")}
          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${type === 'printed_slides' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
        >
          <Copy size={20} />
          {t("slidesType")}
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("formTitle")}</label>
        <input type="text" name="title" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-colors" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("formCollege")}</label>
        <select name="college_id" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white transition-colors">
          <option value="">...</option>
          {colleges.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("formWhatsapp")}</label>
        <input type="tel" name="whatsapp_number" dir="ltr" placeholder={t("whatsappPlaceholder")} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-colors" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("formDesc")}</label>
        <textarea name="description" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-colors resize-none"></textarea>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 disabled:opacity-70 transition-all flex justify-center items-center gap-2"
      >
        {loading ? <span className="animate-pulse">{t("submitting")}</span> : <><Send size={20} /> {t("submitBook")}</>}
      </button>
    </form>
  );
}