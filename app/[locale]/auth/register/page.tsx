import { getTranslations } from "next-intl/server";
import { signUp } from "@/lib/actions/auth";
import { Link } from "@/i18n/routing";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const t = await getTranslations("Auth");
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("registerTitle")}</h1>
        <p className="text-slate-500 text-sm">{t("registerSubtitle")}</p>
      </div>

      {error === "mismatch" && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
          {t("passwordMismatch")}
        </div>
      )}
      {error === "true" && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
          {t("authError")}
        </div>
      )}

      <form action={signUp} className="space-y-4">
        {/* ... الحقول السابقة (الاسم، اسم المستخدم، الإيميل) ... */}
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("fullName")}</label>
          <input type="text" name="full_name" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("username")}</label>
          <input type="text" name="username" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("email")}</label>
          <input type="email" name="email" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("password")}</label>
          <input type="password" name="password" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">{t("confirmPassword")}</label>
          <input type="password" name="confirmPassword" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" />
        </div>

        <button type="submit" className="w-full py-3.5 px-4 mt-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700">
          {t("signUpBtn")}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          {t("haveAccount")} <Link href="/auth/login" className="font-semibold text-teal-600">{t("signInBtn")}</Link>
        </p>
      </div>
    </div>
  );
}