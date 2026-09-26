import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import NavbarAccountClient from "./NavbarAccountClient";

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navigation");
  const toggleLocale = locale === "ar" ? "en" : "ar";
  const toggleText = locale === "ar" ? "English" : "عربي";
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 border-b border-slate-200/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/brand/rafeeq-logo.webp"
            alt=""
            width={44}
            height={45}
            sizes="44px"
            loading="eager"
            className="size-11 rounded-full shadow-[0_8px_22px_-10px_rgba(37,99,235,0.65)] transition duration-300 group-hover:scale-105"
          />
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rafeeq<span className="text-blue-600">.</span>
          </span>
        </Link>

        {/* روابط التنقل */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/resources" className="px-4 py-2.5 rounded-full text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300">
            {t("resources")}
          </Link>
          <Link href="/books" className="px-4 py-2.5 rounded-full text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300">
            {t("books")}
          </Link>
          <Link href="/questions" className="px-4 py-2.5 rounded-full text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300">
            {t("questions")}
          </Link>
          <Link href="/requests" className="px-4 py-2.5 rounded-full text-slate-600 font-medium hover:text-violet-800 hover:bg-violet-50 transition-all duration-300">
            {t("requests")}
          </Link>
        </nav>

        {/* الأزرار / حساب المستخدم */}
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            locale={toggleLocale}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            {toggleText}
          </Link>
          
          <NavbarAccountClient
            locale={locale}
            labels={{ dashboard: t("dashboard"), profile: t("profile"), signOut: t("signOut"), signIn: t("signIn"), signUp: t("signUp") }}
          />
        </div>
      </div>
      <nav aria-label={t("mobileNavigation")} className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/resources" className="shrink-0 rounded-full px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">{t("resources")}</Link>
        <Link href="/books" className="shrink-0 rounded-full px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">{t("books")}</Link>
        <Link href="/questions" className="shrink-0 rounded-full px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">{t("questions")}</Link>
        <Link href="/requests" className="shrink-0 rounded-full bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700">{t("requests")}</Link>
      </nav>
    </header>
  );
}
