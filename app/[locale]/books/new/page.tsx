import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddBookForm from "@/components/books/AddBookForm";

export default async function NewBookPage() {
  const t = await getTranslations("Books");
  const supabase = await createClient();
  
  // حماية الصفحة
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // جلب الكليات للنموذج
  const { data: colleges } = await supabase.from("colleges").select("id, name_ar");

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("addNew")}</h1>
            <p className="text-slate-500">{t("subtitle")}</p>
          </div>
          
          <AddBookForm colleges={colleges || []} />
        </div>
      </div>
    </div>
  );
}