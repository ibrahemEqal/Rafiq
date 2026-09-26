import { z } from "zod";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getCourses } from "@/lib/data/catalog";
import ClientMessages from "@/components/shared/ClientMessages";
import QuestionEditForm from "@/components/questions/QuestionEditForm";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const [route, locale, t, client] = await Promise.all([params, getLocale(), getTranslations("Questions"), createClient()]);
  if (!z.guid().safeParse(route.id).success) notFound();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return redirect({ href: "/auth/login", locale });

  const [{ data: question, error }, { data: profile }, courses] = await Promise.all([
    client.from("questions").select("id, author_id, title, body, course_id").eq("id", route.id).maybeSingle(),
    client.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    getCourses(),
  ]);
  if (error) throw new Error("Question unavailable");
  if (!question || (question.author_id !== user.id && profile?.role !== "admin")) notFound();

  return <ClientMessages namespace="Questions"><section className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-3xl space-y-6">
    <Link href={`/questions/${question.id}`} className="text-sm font-bold text-teal-700">{t("backToQuestion")}</Link>
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h1 className="mb-6 text-2xl font-extrabold text-slate-900">{t("editQuestion")}</h1><QuestionEditForm question={question} courses={courses} /></div>
  </div></section></ClientMessages>;
}
