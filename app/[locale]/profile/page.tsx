import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, BookOpen, FileText, Download, Eye, ShieldCheck, Clock, MessageCircleHeart, Plus } from "lucide-react";
import MarkAsTakenButton from "@/components/profile/MarkAsTakenButton";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { Link } from "@/i18n/routing";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const supabase = await createClient();

  const identity = await getVerifiedIdentity(supabase);
  if (!identity) redirect("/auth/login");

  const [{ data: profile }, { data: books }, { data: resources }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", identity.id).single(),
    supabase
      .from("books")
      .select("id, title, status")
      .eq("owner_id", identity.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("resources")
      .select("id, title, status, download_count, view_count")
      .eq("uploader_id", identity.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("requests")
      .select("id, title, status, created_at")
      .eq("requester_id", identity.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
              {profile?.full_name || "طالب جامعي"}
            </h1>
            <p className="text-slate-500">{identity.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <BookOpen size={24} className="text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900">{t("myBooks")}</h2>
            </div>
            
            {books && books.length > 0 ? (
              <div className="space-y-4">
                {books.map(book => (
                  <div key={book.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 line-clamp-1">{book.title}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${book.status === 'available' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                        {book.status === 'available' ? t("available") : t("taken")}
                      </span>
                    </div>
                    {book.status === 'available' && (
                      <MarkAsTakenButton bookId={book.id} label={t("markAsTaken")} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">{t("noBooks")}</p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <FileText size={24} className="text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">{t("myResources")}</h2>
            </div>

            {resources && resources.length > 0 ? (
              <div className="space-y-4">
                {resources.map(file => (
                  <div key={file.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 mb-3 line-clamp-1">{file.title}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Download size={16} className="text-teal-600" />
                        <span>{file.download_count} {t("downloads")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Eye size={16} className="text-blue-600" />
                        <span>{file.view_count} {t("views")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold mt-3 pt-3 border-t border-slate-200/60">
                      {file.status === 'approved' ? (
                        <><ShieldCheck size={16} className="text-green-600"/> <span className="text-green-700">{t("approved")}</span></>
                      ) : (
                        <><Clock size={16} className="text-orange-500"/> <span className="text-orange-600">{t("pending")}</span></>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">{t("noResources")}</p>
            )}
          </div>

        </div>

        <section className="rounded-3xl border border-violet-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3"><MessageCircleHeart size={24} className="text-violet-600" /><h2 className="text-xl font-bold text-slate-900">{t("myRequests")}</h2></div>
            <Link href="/requests/new" className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-2 text-sm font-extrabold text-violet-700"><Plus size={16} />{t("addRequest")}</Link>
          </div>
          {requests?.length ? <div className="grid gap-3 sm:grid-cols-2">{requests.map(request => <Link key={request.id} href={`/requests/${request.id}`} className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-violet-200 hover:bg-violet-50/50">
            <div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 font-bold text-slate-900 group-hover:text-violet-800">{request.title}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${request.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{request.status === "open" ? t("requestOpen") : t("requestFulfilled")}</span></div>
          </Link>)}</div> : <p className="py-8 text-center text-slate-500">{t("noRequests")}</p>}
        </section>
      </div>
    </div>
  );
}
