"use client";
import { useLocale } from "next-intl";
export default function StudyError({ retry }: { retry: () => void }) {
  const ar = useLocale() === "ar";
  return <section role="alert" className="mx-auto my-12 max-w-xl rounded-3xl border border-red-100 bg-paper p-6"><h2 className="text-xl font-bold">{ar ? "تعذّر تحميل الحقيبة الدراسية" : "Study workspace could not be loaded"}</h2><p className="my-4 text-sm leading-7 text-muted">{ar ? "حدث خطأ في تحميل البيانات. حاول مجددًا بعد قليل." : "The data could not be loaded. Please try again shortly."}</p><button type="button" onClick={retry} className="rounded-xl bg-forest px-5 py-3 font-bold text-white">{ar ? "أعد المحاولة" : "Try again"}</button></section>;
}
