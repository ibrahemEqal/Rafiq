import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/admin/resource-review";
import { ShieldCheck, UserRound } from "lucide-react";

export default async function AdminUsersPage() {
  const [locale, t, supabase] = await Promise.all([
    getLocale(),
    getTranslations("Admin"),
    createClient(),
  ]);

  const access = await getAdminAccess(supabase);
  if (!access.userId) redirect({ href: "/auth/login", locale });
  if (!access.isAdmin) notFound();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-base text-teal-200">
            <ShieldCheck size={18} />{t("adminOnly")}
          </div>
          <h1 className="text-3xl font-extrabold">{t("usersTitle")}</h1>
          <p className="mt-3 text-base leading-8 text-slate-300">{t("usersSubtitle")}</p>
          <Link href="/dashboard" className="mt-5 inline-block text-base font-bold text-teal-300">{t("backToDashboard")}</Link>
        </header>

        {error ? (
          <p className="rounded-2xl bg-red-50 p-5 text-base text-red-700">{t("usersLoadError")}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {(users ?? []).map((user, index) => (
              <article key={user.id} className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-slate-100" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><UserRound size={20} /></span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900">{user.full_name || user.username}</h2>
                    <p className="truncate text-base text-slate-500">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className={`rounded-full px-3 py-1.5 ${user.role === "admin" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>{user.role}</span>
                  <time className="text-slate-500" dateTime={user.created_at}>{date.format(new Date(user.created_at))}</time>
                </div>
              </article>
            ))}
            {!users?.length && <p className="p-10 text-center text-base text-slate-500">{t("usersEmpty")}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
