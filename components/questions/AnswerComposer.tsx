import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import AnswerForm from "./AnswerForm";

export default async function AnswerComposer({ questionId, page }: { questionId: string; page: number }) {
  const [t, client] = await Promise.all([getTranslations("Questions"), createClient()]);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return <p className="text-sm leading-7 text-slate-600">{t("loginToAnswer")} <Link href="/auth/login" className="font-bold text-teal-700 underline">{t("signIn")}</Link></p>;
  return <AnswerForm questionId={questionId} page={page} />;
}
