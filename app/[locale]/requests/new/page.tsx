import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { getCourses } from "@/lib/data/catalog";
import ClientMessages from "@/components/shared/ClientMessages";
import RequestForm from "@/components/requests/RequestForm";

export default async function NewRequestPage() {
  const [t, locale, client] = await Promise.all([getTranslations("Requests"), getLocale(), createClient()]);
  if (!await getVerifiedIdentity(client)) return redirect({ href: "/auth/login", locale });
  const courses = await getCourses();
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return <main className="min-h-screen bg-[#f8f7ff] px-4 py-10 sm:py-14">
    <div className="mx-auto max-w-3xl">
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><BackIcon size={17} />{t("back")}</Link>
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-xl shadow-violet-200/20">
        <header className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10">
          <div className="absolute -end-20 -top-24 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-violet-200"><Sparkles size={14} />{t("newEyebrow")}</span>
            <h1 className="mt-4 text-3xl font-black">{t("newRequest")}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{t("newSubtitle")}</p>
          </div>
        </header>
        <div className="p-6 sm:p-10"><ClientMessages namespace="Requests"><RequestForm courses={courses} /></ClientMessages></div>
      </section>
    </div>
  </main>;
}
