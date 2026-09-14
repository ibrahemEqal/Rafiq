import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UploadForm from "@/components/resources/UploadForm";

export default async function NewResourcePage() {
  const t = await getTranslations("Resources");
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: colleges } = await supabase.from("colleges").select("id, name_ar");
  const { data: courses } = await supabase.from("courses").select("id, name_ar");

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("uploadTitle")}</h1>
            <p className="text-slate-500">{t("uploadSubtitle")}</p>
          </div>
          
          <UploadForm colleges={colleges || []} courses={courses || []} />
        </div>
      </div>
    </div>
  );
}