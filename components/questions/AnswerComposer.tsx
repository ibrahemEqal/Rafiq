import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import ClientMessages from "@/components/shared/ClientMessages";
import AnswerForm from "./AnswerForm";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export default async function AnswerComposer({ questionId, page }: { questionId: string; page: number }) {
  const [t, client] = await Promise.all([getTranslations("Questions"), createClient()]);
  if (!await getVerifiedIdentity(client)) return <p className="text-sm leading-7 text-slate-600">{t("loginToAnswer")} <Link href="/auth/login" className="font-bold text-teal-700 underline">{t("signIn")}</Link></p>;
  return <ClientMessages namespace="Questions"><AnswerForm questionId={questionId} page={page} /></ClientMessages>;
}
