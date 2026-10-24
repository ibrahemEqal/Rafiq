"use client";
import { useLocale } from "next-intl";

export default function BooksError({ retry }: { retry: () => void }) {
  const ar = useLocale() === "ar";
  return <section role="alert" className="mx-auto my-12 max-w-xl rounded-3xl border border-red-100 bg-paper p-6 sm:p-8">
    <h2 className="text-xl font-bold text-ink">{ar ? "تعذّر تحميل سوق الكتب" : "The book market could not be loaded"}</h2>
    <p className="my-4 text-sm leading-7 text-muted">{ar ? "حدث خطأ أثناء تحميل الإعلانات. أعد المحاولة بعد قليل." : "We could not load the listings. Please try again shortly."}</p>
    <button type="button" onClick={retry} className="rounded-xl bg-forest px-5 py-3 font-bold text-white">{ar ? "أعد المحاولة" : "Try again"}</button>
  </section>;
}
