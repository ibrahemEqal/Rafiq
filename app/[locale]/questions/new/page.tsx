import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/data/catalog";
import ClientMessages from "@/components/shared/ClientMessages";
import QuestionForm from "@/components/questions/QuestionForm";

export default async function NewQuestionPage() {
  const [t, locale, client] = await Promise.all([getTranslations("Questions"), getLocale(), createClient()]);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return redirect({ href: "/auth/login", locale });
  const courses = await getCourses();
  return <section className="min-h-screen bg-slate-50 px-4 py-10">
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/questions" className="text-sm font-bold text-teal-700">{t("back")}</Link>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">{t("ask")}</h1>
        <p className="mb-8 mt-3 text-sm leading-7 text-slate-500">{t("newSubtitle")}</p>
        <ClientMessages namespace="Questions"><QuestionForm courses={courses} /></ClientMessages>
      </div>
    </div>
  </section>;
}
