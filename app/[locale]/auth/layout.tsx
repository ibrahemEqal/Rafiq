import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Library } from "lucide-react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] start-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(153,246,228,0.3),transparent_70%)] rounded-full" />
      <div className="absolute bottom-[-10%] end-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(253,230,138,0.3),transparent_70%)] rounded-full" />

      <div className="absolute top-8 start-8">
        <Link href="/" className="text-slate-500 hover:text-teal-600 font-medium text-sm flex items-center gap-2 transition-colors">
          &rarr; {t("backHome")}
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 relative z-10">
        
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-teal-50 text-teal-600 p-2.5 rounded-xl group-hover:bg-teal-100 transition-colors">
              <Library size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-800">Rafeeq.</span>
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
