import { getLocale, getTranslations } from "next-intl/server";
import { signIn } from "@/lib/actions/auth";
import { Link } from "@/i18n/routing";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [t, locale, params] = await Promise.all([getTranslations("Auth"), getLocale(), searchParams]);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink mb-2">{t("loginTitle")}</h1>
        <p className="text-muted text-sm">{t("loginSubtitle")}</p>
      </div>

      {params.check_email === "true" && (
        <div className="mb-6 p-4 bg-sage-soft text-forest text-sm font-semibold rounded-xl border border-sage-soft">
          {t("checkEmail")}
        </div>
      )}
      {params.account_ready === "true" && (
        <div className="mb-6 p-4 bg-sage-soft text-forest text-sm font-semibold rounded-xl border border-sage-soft">
          {t("accountReady")}
        </div>
      )}
      {params.password_updated === "true" && <p role="status" className="mb-6 rounded-xl bg-sage-soft p-4 text-sm font-semibold text-forest">{t("passwordUpdated")}</p>}
      {params.error === "true" && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
          {t("authError")}
        </div>
      )}

      <form action={signIn} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink">{t("email")}</label>
          <input type="email" name="email" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-line focus:border-forest outline-none bg-canvas" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink">{t("password")}</label>
          <input type="password" name="password" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-line focus:border-forest outline-none bg-canvas" />
        </div>

        <div className="text-end"><Link href="/auth/forgot-password" className="text-sm font-semibold text-forest hover:underline">{t("forgotPassword")}</Link></div>
        <AuthSubmitButton idle={t("signInBtn")} pending={t("signingIn")} />
      </form>
      
      {/* ... رابط إنشاء حساب ... */}
      <div className="mt-8 pt-6 border-t border-line-soft text-center">
        <p className="text-sm text-muted">
          {t("noAccount")} <Link href="/auth/register" className="font-semibold text-forest">{t("createAccount")}</Link>
        </p>
      </div>
    </div>
  );
}
