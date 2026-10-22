import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "@/lib/actions/password-reset";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { Link } from "@/i18n/routing";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, locale, params, client] = await Promise.all([getTranslations("Auth"), getLocale(), searchParams, createClient()]);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || params.error === "expired") return <div role="alert" className="space-y-5">
    <h1 className="text-2xl font-bold">{t("newPasswordTitle")}</h1>
    <p className="text-sm leading-7 text-slate-600">{t("resetExpired")}</p>
    <Link href="/auth/forgot-password" className="inline-block font-semibold text-teal-700 hover:underline">{t("sendResetLink")}</Link>
  </div>;
  return <div className="w-full">
    <h1 className="mb-3 text-2xl font-bold text-slate-900">{t("newPasswordTitle")}</h1>
    <p className="mb-6 text-sm leading-7 text-slate-600">{t("newPasswordInstructions")}</p>
    {params.error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-700">{t(params.error === "invalid" ? "resetInvalidPassword" : "resetFailed")}</p>}
    <form action={updatePassword} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="new-password" className="block text-sm font-semibold">{t("password")}</label>
      <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required dir="ltr" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:outline-teal-600" />
      <label htmlFor="confirm-new-password" className="block text-sm font-semibold">{t("confirmPassword")}</label>
      <input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required dir="ltr" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:outline-teal-600" />
      <AuthSubmitButton idle={t("saveNewPassword")} pending={t("savingNewPassword")} />
    </form>
  </div>;
}
