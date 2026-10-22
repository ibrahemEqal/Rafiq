import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, ArrowLeft, ArrowRight, HeartHandshake, MessageCircle, Plus, Search, SlidersHorizontal, Sparkles, UserRound, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createPublicClient } from "@/lib/supabase/public";
import { getColleges } from "@/lib/data/catalog";
import { bookFilters, bookListHref, bookTitlePattern } from "@/lib/books/market";
import BookCard from "@/components/books/BookCard";

const PAGE_SIZE = 12;

export default async function BooksPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, queryParams, colleges] = await Promise.all([getTranslations("Books"), searchParams, getColleges()]);
  const filters = bookFilters(queryParams);
  let query = createPublicClient().from("books")
    .select("id, title, description, type, whatsapp_number, created_at, colleges(name_ar, name_en)")
    .eq("status", "available");
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.college) query = query.eq("college_id", filters.college);
  if (filters.q) query = query.ilike("title", bookTitlePattern(filters.q));
  const offset = (filters.page - 1) * PAGE_SIZE;
  const { data, error } = await query.order("created_at", { ascending: filters.sort === "oldest" }).order("id", { ascending: filters.sort === "oldest" }).range(offset, offset + PAGE_SIZE);
  if (error) throw new Error("Book listings unavailable");
  const books = (data ?? []).slice(0, PAGE_SIZE);
  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const filtered = Boolean(filters.q || filters.college || filters.type);
  const Previous = locale === "ar" ? ArrowRight : ArrowLeft;
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;
  const tabs = [["", "allItems"], ["book", "booksOnly"], ["printed_slides", "slidesOnly"]] as const;
  const fieldClass = "min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50";

  return <div className="min-h-screen bg-[#f6f8fb] pb-20 pt-6 sm:pt-8">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 size-80 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-2 text-xs font-bold text-teal-200"><Sparkles size={14} aria-hidden="true" />{t("marketBadge")}</p>
            <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{t("title")}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{t("marketIntro")}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/books/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 py-3 font-black text-slate-950 transition hover:bg-teal-300"><Plus size={19} aria-hidden="true" />{t("addNew")}</Link>
              <Link href="/profile" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-bold text-white hover:bg-white/10"><UserRound size={17} aria-hidden="true" />{t("myListings")}</Link>
            </div>
          </div>
          <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 lg:block">
            <HeartHandshake size={32} aria-hidden="true" className="mb-4 text-teal-300" />
            <h2 className="text-xl font-black">{t("giveAnotherLife")}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{t("giveAnotherLifeHint")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold"><BookOpen size={14} aria-hidden="true" />{t("freeLabel")}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold"><MessageCircle size={14} aria-hidden="true" />{t("directContact")}</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={t("filterListings")} className="relative mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <form method="get" className="grid grid-cols-2 items-end gap-4 lg:grid-cols-[2fr_1.3fr_1fr_auto]">
          {filters.type && <input type="hidden" name="type" value={filters.type} />}
          <div className="col-span-2 lg:col-span-1"><label htmlFor="book-search" className="mb-2 block text-sm font-bold text-slate-700">{t("searchLabel")}</label><div className="relative"><Search size={18} aria-hidden="true" className="pointer-events-none absolute start-3.5 top-4 text-slate-400" /><input id="book-search" name="q" type="search" maxLength={80} defaultValue={filters.q} placeholder={t("searchPlaceholder")} className={`${fieldClass} ps-10`} /></div></div>
          <div><label htmlFor="book-college" className="mb-2 block text-sm font-bold text-slate-700">{t("college")}</label><select id="book-college" name="college" defaultValue={filters.college} className={fieldClass}><option value="">{t("allColleges")}</option>{colleges.map(college => <option key={college.id} value={college.id}>{locale === "ar" ? college.name_ar : college.name_en}</option>)}</select></div>
          <div><label htmlFor="book-sort" className="mb-2 block text-sm font-bold text-slate-700">{t("sortLabel")}</label><select id="book-sort" name="sort" defaultValue={filters.sort} className={fieldClass}><option value="newest">{t("newest")}</option><option value="oldest">{t("oldest")}</option></select></div>
          <button className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700 lg:col-span-1"><SlidersHorizontal size={17} aria-hidden="true" />{t("applyFilters")}</button>
        </form>
      </section>

      <section aria-labelledby="book-results-heading" className="mt-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h2 id="book-results-heading" className="text-2xl font-black text-slate-950">{t("browseListings")}</h2><p className="mt-1 text-sm text-slate-500">{t("availableOnly")}</p></div>
          <nav aria-label={t("listingType")} className="flex w-full gap-1 rounded-2xl border border-slate-200 bg-white p-1 sm:w-auto">
            {tabs.map(([type, label]) => <Link key={label} href={bookListHref(filters, { type, page: 1 })} aria-current={filters.type === type ? "page" : undefined} className={`flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition sm:flex-none sm:px-5 ${filters.type === type ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{t(label)}</Link>)}
          </nav>
        </div>
        {filtered && <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-600"><p>{t("filteredResults")}{filters.q && <span dir="auto" className="ms-2 font-bold text-slate-900">“{filters.q}”</span>}</p><Link href="/books" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 font-bold text-teal-700 hover:border-teal-400"><X size={14} aria-hidden="true" />{t("clearFilters")}</Link></div>}
        {books.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{books.map(book => <BookCard key={book.id} book={book} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><BookOpen size={30} aria-hidden="true" /></span>
          <h3 className="text-xl font-black text-slate-900">{t(filtered || filters.page > 1 ? "noMatchingListings" : "noResults")}</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500">{t(filtered ? "tryAnotherFilter" : "emptyHint")}</p>
          <Link href={filtered || filters.page > 1 ? "/books" : "/books/new"} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"><Plus size={17} aria-hidden="true" />{t(filtered || filters.page > 1 ? "backToMarket" : "addNew")}</Link>
        </div>}
        {(filters.page > 1 || hasMore) && <nav aria-label={t("pagination")} className="mt-8 flex items-center justify-center gap-3">
          {filters.page > 1 && <Link href={bookListHref(filters, { page: filters.page - 1 })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><Previous size={16} aria-hidden="true" />{t("previousPage")}</Link>}
          <span className="text-sm font-bold text-slate-500">{t("pageNumber", { page: filters.page })}</span>
          {hasMore && <Link href={bookListHref(filters, { page: filters.page + 1 })} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">{t("nextPage")}<Next size={16} aria-hidden="true" /></Link>}
        </nav>}
      </section>
      <p className="mt-8 text-center text-xs leading-6 text-slate-500">{t("handoverHint")}</p>
    </div>
  </div>;
}
