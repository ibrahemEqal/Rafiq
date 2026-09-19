import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import UploadForm from "@/components/resources/UploadForm";
import ClientMessages from "@/components/shared/ClientMessages";
import { getUploadCatalog } from "@/lib/data/catalog";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export default async function NewResourcePage() {
  const [t, locale, supabase] = await Promise.all([getTranslations("Resources"), getLocale(), createClient()]);
  
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return redirect({ href: "/auth/login", locale });

  const { colleges, courses } = await getUploadCatalog();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("uploadTitle")}</h1>
            <p className="text-slate-500">{t("uploadSubtitle")}</p>
          </div>
          
          <ClientMessages namespace="Resources">
            <UploadForm colleges={colleges} courses={courses} userId={identity.id} />
          </ClientMessages>
        </div>
      </div>
    </div>
  );
}
