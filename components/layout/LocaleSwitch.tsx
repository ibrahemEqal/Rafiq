"use client";
import { usePathname, useRouter } from "@/i18n/routing";
export default function LocaleSwitch({ locale }: { locale: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() =>
        router.replace(
          `${path}${window.location.search}${window.location.hash}`,
          { locale: locale === "ar" ? "en" : "ar" },
        )
      }
      className="min-h-10 rounded-full px-3 text-xs font-bold text-slate-500 hover:bg-slate-50"
    >
      {locale === "ar" ? "English" : "عربي"}
    </button>
  );
}
