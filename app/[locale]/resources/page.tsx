import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Search, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";
import ResourceFilters from "@/components/resources/ResourceFilters";
import ResourceCard from "@/components/resources/ResourceCard";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const t = await getTranslations("Resources");
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("resources")
    .select(`
      id, title, type, file_size, download_count, view_count, created_at,
      courses (name_ar, name_en),
      profiles!resources_uploader_id_fkey (full_name)
    `)
    .eq('status', 'approved');

  const q = params?.q?.trim().slice(0, 80) || "";
  const allowedTypes = new Set(["summary", "previous_exam", "lecture", "assignment", "notes", "other"]);
  const selectedType = allowedTypes.has(params?.type || "") ? params.type : undefined;

  if (q) {
    query = query.textSearch('search_vector', q, { config: 'simple', type: 'websearch' });
  }
  if (selectedType) {
    query = query.eq('type', selectedType);
  }

  const { data: resources } = await query.order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-8 pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              {t("title")}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/resources/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-600/20 hover:bg-teal-700 transition-all shrink-0"
          >
            <Plus size={20} />
            <span>{t("uploadResource")}</span>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-72 shrink-0 sticky top-28 hidden lg:block">
            <ResourceFilters selectedType={selectedType} query={q} />
          </aside>

          <main className="flex-1 w-full">
            <form method="get" className="relative mb-8 group">
              <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors ps-4">
                <Search size={22} />
              </div>
              {selectedType && <input type="hidden" name="type" value={selectedType} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                maxLength={80}
                placeholder={t("searchPlaceholder")}
                className="w-full py-4 px-4 pe-24 ps-12 bg-white border border-slate-200 rounded-2xl shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none text-slate-900 text-lg transition-all"
              />
              <button type="submit" className="absolute end-2 top-2 rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white hover:bg-slate-800">بحث</button>
            </form>

            {resources && resources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource as Parameters<typeof ResourceCard>[0]["resource"]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t("noResults")}</h3>
                <p className="text-slate-500">{t("clearFilters")}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}