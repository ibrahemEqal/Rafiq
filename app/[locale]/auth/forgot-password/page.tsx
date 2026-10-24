import { getLocale, getTranslations } from "next-intl/server";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { Link } from "@/i18n/routing";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, locale, params] = await Promise.all([getTranslations("Auth"), getLocale(), searchParams]);
  const sent = params.result === "sent";
  const error = typeof params.result === "string" && !sent;
  const message = params.result === "rate_limited" ? "resetRateLimited" : params.result === "expired" ? "resetExpired" : params.result === "invalid" ? "resetInvalidEmail" : "resetFailed";
  return <div className="w-full">
    <h1 className="mb-3 text-2xl font-bold text-ink">{t("forgotPassword")}</h1>
    <p className="mb-6 text-sm leading-7 text-muted">{t("resetInstructions")}</p>
    {sent && <p role="status" className="mb-6 rounded-xl bg-sage-soft p-4 text-sm leading-7 text-forest">{t("resetSent")}</p>}
    {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-700">{t(message)}</p>}
    <form action={requestPasswordReset} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="reset-email" className="block text-sm font-semibold">{t("email")}</label>
      <input id="reset-email" name="email" type="email" autoComplete="email" maxLength={254} required dir="ltr" className="w-full rounded-xl border border-line bg-canvas px-4 py-3 focus:outline-forest" />
      <AuthSubmitButton idle={t("sendResetLink")} pending={t("sendingResetLink")} />
    </form>
    <Link href="/auth/login" className="mt-6 inline-block text-sm font-semibold text-forest hover:underline">{t("backToLogin")}</Link>
  </div>;
}
