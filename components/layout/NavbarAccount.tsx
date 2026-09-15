import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { User, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function NavbarAccount() {
  const [t, supabase] = await Promise.all([getTranslations("Navigation"), createClient()]);
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };

  return <div className="flex items-center gap-3">
    {profile?.role === "admin" && <Link href="/dashboard" aria-label={t("dashboard")} title={t("dashboard")} className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100">
      <ShieldCheck size={18} /><span className="hidden sm:inline">{t("dashboard")}</span>
    </Link>}
    <div className="hidden sm:flex items-center gap-2 border-s border-slate-200 ps-4">
      {email ? <details className="relative group">
        <summary aria-label={t("profile")} className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1.5 hover:bg-slate-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700 shadow-sm">{email.charAt(0).toUpperCase()}</span>
        </summary>
        <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2"><p className="truncate text-xs text-slate-500">{email}</p></div>
          <div className="p-1"><Link href="/profile" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><User size={16} />{t("profile")}</Link></div>
          <div className="border-t border-slate-100 p-1"><SignOutButton label={t("signOut")} /></div>
        </div>
      </details> : <>
        <Link href="/auth/login" className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-teal-600">{t("signIn")}</Link>
        <Link href="/auth/register" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800">{t("signUp")}</Link>
      </>}
    </div>
  </div>;
}
