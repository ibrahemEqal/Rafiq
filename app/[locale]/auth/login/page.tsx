import { getTranslations } from "next-intl/server";
import { signIn } from "@/lib/actions/auth";
import { Link } from "@/i18n/routing";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const t = await getTranslations("Auth");
  const params = await searchParams;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("loginTitle")}</h1>
        <p className="text-slate-500 text-sm">{t("loginSubtitle")}</p>
      </div>

      {params.check_email === "true" && (
        <div className="mb-6 p-4 bg-teal-50 text-teal-700 text-sm font-semibold rounded-xl border border-teal-100">
          {t("checkEmail")}
        </div>
      )}
      {params.error === "true" && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
          {t("authError")}
        </div>
      )}

      <form action={signIn} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{t("email")}</label>
          <input type="email" name="email" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">{t("password")}</label>
          <input type="password" name="password" required dir="ltr" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-slate-50" />
        </div>

        <button type="submit" className="w-full py-3.5 px-4 mt-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700">
          {t("signInBtn")}
        </button>
      </form>
      
      {/* ... رابط إنشاء حساب ... */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          {t("noAccount")} <Link href="/auth/register" className="font-semibold text-teal-600">{t("createAccount")}</Link>
        </p>
      </div>
    </div>
  );
}