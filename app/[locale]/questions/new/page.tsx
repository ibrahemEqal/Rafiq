import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/data/catalog";
import ClientMessages from "@/components/shared/ClientMessages";
import QuestionForm from "@/components/questions/QuestionForm";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export default async function NewQuestionPage() {
  const [t, locale, client] = await Promise.all([getTranslations("Questions"), getLocale(), createClient()]);
  if (!await getVerifiedIdentity(client)) return redirect({ href: "/auth/login", locale });
  const courses = await getCourses();
  return <section className="min-h-screen bg-canvas px-4 py-10">
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/questions" className="text-sm font-bold text-forest">{t("back")}</Link>
      <div className="rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-ink">{t("ask")}</h1>
        <p className="mb-8 mt-3 text-sm leading-7 text-muted">{t("newSubtitle")}</p>
        <ClientMessages namespace="Questions"><QuestionForm courses={courses} /></ClientMessages>
      </div>
    </div>
  </section>;
}
