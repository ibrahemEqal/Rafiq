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
    <section className="min-h-screen bg-canvas px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-forest p-6 text-white sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 text-base text-mist">
            <ShieldCheck size={18} />{t("adminOnly")}
          </div>
          <h1 className="text-3xl font-bold">{t("usersTitle")}</h1>
          <p className="mt-3 text-base leading-8 text-mist">{t("usersSubtitle")}</p>
          <Link href="/dashboard" className="mt-5 inline-block text-base font-bold text-mist">{t("backToDashboard")}</Link>
        </header>

        {error ? (
          <p className="rounded-2xl bg-red-50 p-5 text-base text-red-700">{t("usersLoadError")}</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
            {(users ?? []).map((user, index) => (
              <article key={user.id} className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${index ? "border-t border-line-soft" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-xl bg-sage-soft p-2.5 text-muted"><UserRound size={20} /></span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-ink">{user.full_name || user.username}</h2>
                    <p className="truncate text-base text-muted">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className={`rounded-full px-3 py-1.5 ${user.role === "admin" ? "bg-sage-soft text-forest" : "bg-sage-soft text-muted"}`}>{user.role}</span>
                  <time className="text-muted" dateTime={user.created_at}>{date.format(new Date(user.created_at))}</time>
                </div>
              </article>
            ))}
            {!users?.length && <p className="p-10 text-center text-base text-muted">{t("usersEmpty")}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
