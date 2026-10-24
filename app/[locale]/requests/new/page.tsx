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

  return <main className="min-h-screen bg-canvas px-4 py-10 sm:py-14">
    <div className="mx-auto max-w-3xl">
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-bold text-forest"><BackIcon size={17} />{t("back")}</Link>
      <section className="mt-6 overflow-hidden rounded-[2rem] border border-sage-soft bg-paper shadow-sm shadow-forest/20">
        <header className="relative overflow-hidden bg-forest p-7 text-white sm:p-10">
          <div className="absolute -end-20 -top-24 h-64 w-64 rounded-full bg-forest/30 blur-3xl" />
          <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1.5 text-xs font-bold text-mist"><Sparkles size={14} />{t("newEyebrow")}</span>
            <h1 className="mt-4 text-3xl font-bold">{t("newRequest")}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-mist">{t("newSubtitle")}</p>
          </div>
        </header>
        <div className="p-6 sm:p-10"><ClientMessages namespace="Requests"><RequestForm courses={courses} /></ClientMessages></div>
      </section>
    </div>
  </main>;
}
