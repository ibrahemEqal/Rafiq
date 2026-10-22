import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Copy, GraduationCap, MessageCircle, ArrowUpRight, CalendarDays } from "lucide-react";
import { oneRelation } from "@/lib/data/relations";
import { normalizeWhatsapp } from "@/lib/books/market";

type Book = {
  id: string; title: string; description: string | null; type: string;
  whatsapp_number: string; created_at: string;
  colleges: { name_ar: string; name_en: string } | { name_ar: string; name_en: string }[] | null;
};

export default async function BookCard({ book }: { book: Book }) {
  const [t, locale] = await Promise.all([getTranslations("Books"), getLocale()]);
  const college = oneRelation(book.colleges);
  const slides = book.type === "printed_slides";
  const phone = normalizeWhatsapp(book.whatsapp_number);
  const date = new Date(book.created_at);
  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg motion-reduce:transform-none">
    <div className={`relative flex items-center justify-between gap-3 overflow-hidden border-b px-5 py-5 ${slides ? "border-amber-100 bg-amber-50" : "border-teal-100 bg-teal-50"}`}>
      <div className="relative flex items-center gap-3">
        <span className={`flex size-12 items-center justify-center rounded-2xl border bg-white shadow-sm ${slides ? "border-amber-200 text-amber-700" : "border-teal-200 text-teal-700"}`}>{slides ? <Copy size={24} aria-hidden="true" /> : <BookOpen size={24} aria-hidden="true" />}</span>
        <span className={`text-sm font-black ${slides ? "text-amber-800" : "text-teal-800"}`}>{t(slides ? "slidesType" : "bookType")}</span>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white bg-white/90 px-2.5 py-1.5 text-xs font-bold text-emerald-800"><span className="size-1.5 rounded-full bg-emerald-500" />{t("available")}</span>
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <p className="mb-2 text-xs font-black text-teal-700">{t("freeLabel")}</p>
      <h3 dir="auto" className="break-words text-xl font-black leading-8 text-slate-950">{book.title}</h3>
      {book.description ? <details className="mt-3 text-sm leading-7 text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-500 hover:text-teal-700">{t("viewNotes")}</summary>
        <p dir="auto" className="mt-2 whitespace-pre-wrap break-words">{book.description}</p>
      </details> : <p className="mt-3 text-sm leading-7 text-slate-500">{t("noNotes")}</p>}
      <div className="mt-auto space-y-2.5 pt-6 text-sm text-slate-500">
        <p className="flex items-start gap-2"><GraduationCap size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" /><span className="break-words">{college ? (locale === "ar" ? college.name_ar : college.name_en) : t("allColleges")}</span></p>
        {Number.isFinite(date.getTime()) && <p className="flex items-center gap-2"><CalendarDays size={16} aria-hidden="true" className="shrink-0 text-slate-400" /><time dateTime={date.toISOString()}>{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date)}</time></p>}
      </div>
      {phone ? <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" aria-label={`${t("contactWhatsapp")} — ${book.title}`} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-bold text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
        <MessageCircle size={18} aria-hidden="true" />{t("contactWhatsapp")}<ArrowUpRight size={16} aria-hidden="true" className="ms-auto" /><span className="sr-only">{t("newTab")}</span>
      </a> : <p className="mt-5 rounded-xl bg-slate-100 p-3 text-center text-sm text-slate-500">{t("contactUnavailable")}</p>}
    </div>
  </article>;
}
