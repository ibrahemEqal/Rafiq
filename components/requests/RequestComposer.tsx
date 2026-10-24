import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import ResponseForm from "./ResponseForm";
import RequestStatusActions from "./RequestStatusActions";

export default async function RequestComposer({ requestId, requesterId, status }: { requestId: string; requesterId: string; status: string }) {
  const [t, client] = await Promise.all([getTranslations("Requests"), createClient()]);
  const identity = await getVerifiedIdentity(client);
  if (!identity) return <div className="rounded-3xl border border-line bg-paper p-6 text-sm leading-7 text-muted shadow-sm">
    {t("loginToHelp")} <Link href="/auth/login" className="font-bold text-forest underline">{t("signIn")}</Link>
  </div>;
  if (identity.id === requesterId) return <RequestStatusActions requestId={requestId} status={status} />;
  if (status !== "open") return <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-bold leading-7 text-emerald-800">{t("alreadyFulfilled")}</div>;
  return <div className="rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-7"><ResponseForm requestId={requestId} /></div>;
}
