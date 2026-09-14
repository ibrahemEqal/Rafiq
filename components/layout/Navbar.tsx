import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { BookOpen, Library, MessageCircleQuestion, Sparkles, User } from "lucide-react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navigation");
  const toggleLocale = locale === "ar" ? "en" : "ar";
  const toggleText = locale === "ar" ? "English" : "عربي";

  // إخفاء النافبار في صفحات المصادقة
  const headerList = await headers();
  const pathname = headerList.get("x-invoke-path") || "";
  if (pathname.includes("/auth")) return null;

  // فحص الجلسة (هل المستخدم مسجل دخول؟)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/50 backdrop-blur-2xl border-b border-slate-200/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* الشعار */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white shadow-[0_0_20px_rgba(15,23,42,0.1)] group-hover:shadow-[0_0_25px_rgba(13,148,136,0.3)] transition-all duration-500">
            <Sparkles size={16} className="absolute -top-1 -end-1 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Library size={20} className="group-hover:text-teal-400 transition-colors duration-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Rafeeq<span className="text-teal-600">.</span>
          </span>
        </Link>

        {/* روابط التنقل */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/resources" className="px-5 py-2.5 rounded-full text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300">
            {t("resources")}
          </Link>
          <Link href="/books" className="px-5 py-2.5 rounded-full text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300">
            {t("books")}
          </Link>
          <Link href="/questions" className="px-5 py-2.5 rounded-full text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300">
            {t("questions")}
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
          
          <div className="hidden sm:flex items-center gap-2 border-s border-slate-200 ps-4">
            {user ? (
              // إذا كان مسجلاً للدخول، أظهر القائمة المنسدلة
              <div className="relative group">
                <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                  <div className="w-9 h-9 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full font-bold shadow-sm">
                    {/* عرض أول حرف من إيميله (مؤقتاً لحين جلب بروفايله) */}
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {/* القائمة المنسدلة (تظهر عند الـ Hover) */}
                <div className="absolute end-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                      <User size={16} />
                      {t("profile")}
                    </Link>
                  </div>
                  <div className="p-1 border-t border-slate-100">
                    <SignOutButton />
                  </div>
                </div>
              </div>
            ) : (
              // إذا لم يكن مسجلاً للدخول، أظهر الأزرار العادية
              <>
                <Link 
                  href="/auth/login" 
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-teal-600 transition-colors"
                >
                  {t("signIn")}
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("signUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}