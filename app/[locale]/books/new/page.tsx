import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import AddBookForm from "@/components/books/AddBookForm";
import ClientMessages from "@/components/shared/ClientMessages";
import { getColleges } from "@/lib/data/catalog";
import { ArrowRight, BookOpen, HeartHandshake } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export default async function NewBookPage() {
  const [t, locale, supabase] = await Promise.all([getTranslations("Books"), getLocale(), createClient()]);
  
  // حماية الصفحة
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return redirect({ href: "/auth/login", locale });

  // جلب الكليات للنموذج
  const colleges = await getColleges();

  return (
    <div className="min-h-screen bg-canvas py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <Link href="/books" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-forest"><ArrowRight size={17} aria-hidden="true" className={locale === "en" ? "rotate-180" : undefined} />{t("backToMarket")}</Link>
        <div className="bg-paper rounded-3xl border border-line p-5 shadow-sm sm:p-8">
          <div className="mb-8 border-b border-line-soft pb-6">
            <span className="mb-4 inline-flex rounded-2xl bg-sage-soft p-3 text-forest"><BookOpen size={25} aria-hidden="true" /></span>
            <h1 className="text-2xl font-bold text-ink mb-2">{t("addNew")}</h1>
            <p className="mt-3 text-sm leading-7 text-muted">{t("newListingIntro")}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-forest"><HeartHandshake size={15} aria-hidden="true" />{t("freeLabel")}</p>
          </div>
          
          <ClientMessages namespace="Books"><AddBookForm colleges={colleges} /></ClientMessages>
        </div>
      </div>
    </div>
  );
}
