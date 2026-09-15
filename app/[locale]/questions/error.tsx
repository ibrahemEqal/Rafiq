"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

export default function QuestionsError({ reset }: { reset: () => void }) {
  const ar = useLocale() === "ar";
  return <section role="alert" className="mx-auto my-12 w-full max-w-2xl rounded-3xl border border-red-100 bg-white p-8">
    <h2 className="text-xl font-bold">{ar ? "تعذر تحميل قسم الأسئلة" : "Questions could not be loaded"}</h2>
    <p className="my-4 text-slate-500">{ar ? "حدث خطأ في الاتصال. أعد المحاولة؛ لم يتم حذف أي منشور." : "A connection error occurred. Try again; no post was deleted."}</p>
    <div className="flex gap-4"><button type="button" onClick={reset} className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">{ar ? "أعد المحاولة" : "Try again"}</button>
      <Link href="/questions" className="px-4 py-3 font-bold text-teal-700">{ar ? "كل الأسئلة" : "All questions"}</Link></div>
  </section>;
}
