import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import AddBookForm from "@/components/books/AddBookForm";
import ClientMessages from "@/components/shared/ClientMessages";
import { getColleges } from "@/lib/data/catalog";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export default async function NewBookPage() {
  const [t, locale, supabase] = await Promise.all([getTranslations("Books"), getLocale(), createClient()]);
  
  // حماية الصفحة
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return redirect({ href: "/auth/login", locale });

  // جلب الكليات للنموذج
  const colleges = await getColleges();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("addNew")}</h1>
            <p className="text-slate-500">{t("subtitle")}</p>
          </div>
          
          <ClientMessages namespace="Books"><AddBookForm colleges={colleges} /></ClientMessages>
        </div>
      </div>
    </div>
  );
}
