import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth");

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-canvas flex flex-col justify-center items-center px-4 py-24 relative overflow-hidden">
      
      <div className="absolute top-[-10%] start-[-10%] w-[40%] h-[40%] bg-sage/35 blur-3xl rounded-full" />
      <div className="absolute bottom-[-10%] end-[-10%] w-[40%] h-[40%] bg-sand/60 blur-3xl rounded-full" />

      <div className="absolute top-8 start-8">
        <Link href="/" className="text-muted hover:text-forest font-medium text-sm flex items-center gap-2 transition-colors">
          &rarr; {t("backHome")}
        </Link>
      </div>

      <div className="w-full max-w-md bg-paper rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-line p-8 sm:p-12 relative z-10">
        
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/brand/rafeeq-logo.webp" alt="" width={42} height={43} sizes="42px" className="size-11 rounded-full" />
            <span className="text-2xl font-bold text-ink">Rafeeq.</span>
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
