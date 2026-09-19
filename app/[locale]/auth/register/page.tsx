import { getLocale, getTranslations } from "next-intl/server";
import { signUp } from "@/lib/actions/auth";
import { Link } from "@/i18n/routing";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const [t, locale, params] = await Promise.all([getTranslations("Auth"), getLocale(), searchParams]);
  const error = params.error;
  const errorKey = ["mismatch", "invalid", "email_exists", "rate_limited", "failed", "config"].includes(error ?? "") ? error : null;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("registerTitle")}</h1>
        <p className="text-slate-500 text-sm">{t("registerSubtitle")}</p>
      </div>

      {errorKey && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
          {t(`signupErrors.${errorKey}`)}
        </div>
      )}

      <form action={signUp} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {/* ... الحقول السابقة (الاسم، اسم المستخدم، الإيميل) ... */}
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("fullName")}</label>
          <input type="text" name="full_name" required minLength={2} maxLength={100} autoComplete="name" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("username")}</label>
          <input type="text" name="username" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" autoComplete="username" dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("email")}</label>
          <input type="email" name="email" required maxLength={254} autoComplete="email" dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("password")}</label>
          <input type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("confirmPassword")}</label>
          <input type="password" name="confirmPassword" required minLength={8} maxLength={72} autoComplete="new-password" dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <AuthSubmitButton idle={t("signUpBtn")} pending={t("signingUp")} />
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          {t("haveAccount")} <Link href="/auth/login" className="font-semibold text-teal-600">{t("signInBtn")}</Link>
        </p>
      </div>
    </div>
  );
}
