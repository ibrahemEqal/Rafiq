import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";
import { BadgeCheck, BookOpen, Clock3, Copy, LibraryBig, MapPin, MessageCircle, Plus, Search, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getColleges } from "@/lib/data/catalog";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/admin/resource-review";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";

const bookTypes = new Set(["book", "printed_slides"]);
type BookRow = {
  id: string;
  title: string;
  description: string | null;
  type: "book" | "printed_slides";
  college_id: string | null;
  whatsapp_number: string;
  created_at: string;
  colleges: { name_ar: string; name_en: string } | { name_ar: string; name_en: string }[] | null;
};

export default async function BooksPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const [t, colleges, adminAccess] = await Promise.all([getTranslations("Books"), getColleges(), getAdminAccess(await createClient())]);
  const q = typeof rawParams.q === "string" ? rawParams.q.trim().slice(0, 80) : "";
  const type = bookTypes.has(rawParams.type ?? "") ? rawParams.type : undefined;
  const collegeId = z.guid().safeParse(rawParams.college).success ? rawParams.college : undefined;

  let query = createPublicClient().from("books").select(`
    id, title, description, type, college_id, whatsapp_number, created_at,
    colleges (name_ar, name_en)
  `).eq("status", "available");
  if (type) query = query.eq("type", type);
  if (collegeId) query = query.eq("college_id", collegeId);
  if (q) query = query.ilike("title", `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(60);
  if (error) throw new Error("Book market unavailable");
  const books = (data ?? []) as unknown as BookRow[];
  const bookCount = books.filter(item => item.type === "book").length;
  const slidesCount = books.length - bookCount;
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en", { day: "numeric", month: "short" });
  const hrefFor = (next: { type?: string; college?: string; q?: string }) => {
    const values = { type, college: collegeId, q, ...next };
    const url = new URLSearchParams();
    if (values.type) url.set("type", values.type);
    if (values.college) url.set("college", values.college);
    if (values.q) url.set("q", values.q);
    return `/books${url.size ? `?${url}` : ""}`;
  };

  return <div className="min-h-screen bg-[#f5f7fb] pb-24 pt-6 sm:pt-10">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-9 text-white shadow-2xl shadow-slate-950/15 sm:px-10 sm:py-12 lg:px-14">
        <div className="absolute -end-20 -top-24 -z-10 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 start-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-violet-200"><Sparkles size={16} />{t("marketBadge")}</span>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{t("title")}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{t("subtitle")}</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-full bg-white/10 px-4 py-2">{t("availableCount", { count: books.length })}</span>
              <span className="rounded-full bg-white/10 px-4 py-2">{t("booksCount", { count: bookCount })}</span>
              <span className="rounded-full bg-white/10 px-4 py-2">{t("slidesCount", { count: slidesCount })}</span>
            </div>
          </div>
          <Link href="/books/new" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-violet-400 px-6 font-black text-slate-950 shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:bg-violet-300">
            <Plus size={21} />{t("addNew")}
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-1 max-w-6xl rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 sm:-mt-5 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { value: undefined, label: t("allTypes") },
            { value: "book", label: t("bookType") },
            { value: "printed_slides", label: t("slidesType") },
          ].map(option => <Link key={option.value ?? "all"} href={hrefFor({ type: option.value })} className={`rounded-full px-4 py-2 text-sm font-black transition ${type === option.value || (!type && !option.value) ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{option.label}</Link>)}
        </div>
        <form method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)_auto]">
          {type && <input type="hidden" name="type" value={type} />}
          <label className="relative block">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input name="q" type="search" defaultValue={q} maxLength={80} placeholder={t("searchPlaceholder")} className="h-[3.25rem] w-full rounded-2xl border border-slate-200 bg-slate-50 pe-4 ps-12 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" />
          </label>
          <label>
            <span className="sr-only">{t("formCollege")}</span>
            <select name="college" defaultValue={collegeId ?? ""} className="h-[3.25rem] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100">
              <option value="">{t("allColleges")}</option>
              {colleges.map(college => <option key={college.id} value={college.id}>{locale === "ar" ? college.name_ar : college.name_en}</option>)}
            </select>
          </label>
          <button className="h-[3.25rem] rounded-2xl bg-violet-600 px-7 font-black text-white transition hover:bg-violet-700">{t("applyFilters")}</button>
        </form>
        {(q || type || collegeId) && <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-sm"><span className="font-bold text-slate-500">{t("filteredResults", { count: books.length })}</span><Link href="/books" className="font-black text-violet-700 hover:text-violet-900">{t("clearFilters")}</Link></div>}
      </section>

      <div className="mb-6 mt-10 flex items-end justify-between gap-5">
        <div><p className="text-sm font-black text-violet-700">{t("recentlyAdded")}</p><h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{t("browseTitle")}</h2></div>
        <p className="hidden max-w-md text-sm leading-7 text-slate-500 md:block">{t("browseSubtitle")}</p>
      </div>

      {books.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {books.map(item => {
          const college = Array.isArray(item.colleges) ? item.colleges[0] : item.colleges;
          const isBook = item.type === "book";
          return <article key={item.id} className="group relative flex min-h-80 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/70">
            <div className={`absolute inset-x-0 top-0 h-1.5 ${isBook ? "bg-gradient-to-r from-violet-500 to-indigo-400" : "bg-gradient-to-r from-amber-400 to-orange-500"}`} />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isBook ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}`}>{isBook ? <BookOpen size={27} /> : <Copy size={27} />}</div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"><BadgeCheck size={14} />{t("available")}</span>
            </div>
            <p className={`mb-2 text-xs font-black uppercase tracking-wider ${isBook ? "text-violet-700" : "text-amber-700"}`}>{isBook ? t("bookType") : t("slidesType")}</p>
            <h3 className="line-clamp-2 text-xl font-black leading-8 text-slate-950">{item.title}</h3>
            <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">{item.description || t("noDescription")}</p>
            <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-500">
              {college && <div className="flex items-start gap-2"><MapPin className="mt-0.5 shrink-0 text-violet-500" size={16} /><span className="line-clamp-1">{locale === "ar" ? college.name_ar : college.name_en}</span></div>}
              <div className="flex items-center gap-2"><Clock3 className="shrink-0 text-slate-400" size={16} /><span>{t("listedOn", { date: dateFormatter.format(new Date(item.created_at)) })}</span></div>
            </div>
            <a href={whatsAppHref(item.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#e9fbf0] font-black text-[#087a49] transition group-hover:bg-[#25D366] group-hover:text-white">
              <MessageCircle size={20} />{t("contactWhatsapp")}
            </a>
            {adminAccess.isAdmin && <div className="mt-3"><AdminDeleteButton kind="book" id={item.id} label={locale === "ar" ? "حذف العرض" : "Delete listing"} /></div>}
          </article>;
        })}
      </div> : <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400"><LibraryBig size={38} /></div>
        <h3 className="mt-5 text-2xl font-black text-slate-900">{t("noResults")}</h3>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">{t("emptyHint")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/books" className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">{t("clearFilters")}</Link><Link href="/books/new" className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white">{t("addNew")}</Link></div>
      </div>}
    </div>
  </div>;
}

function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
