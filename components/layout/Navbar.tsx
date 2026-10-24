import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import NavbarAccountClient from "./NavbarAccountClient";
import MainNav from "./MainNav";
import LocaleSwitch from "./LocaleSwitch";
export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navigation");
  const labels = Object.fromEntries(
    [
      "companion",
      "circles",
      "study",
      "resources",
      "books",
      "questions",
      "requests",
      "offers",
      "mobileNavigation",
    ].map((key) => [key, t(key)]),
  );
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#dfe5d8] bg-[#fffefa]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/brand/rafeeq-logo.webp"
            alt=""
            width={38}
            height={39}
            sizes="38px"
            loading="eager"
            className="size-[38px] rounded-full"
          />
          <span className="text-2xl font-bold tracking-tight text-[#203c31]">
            Rafeeq<span className="text-[#9b744c]">.</span>
          </span>
        </Link>
        <div className="hidden 2xl:block">
          <MainNav labels={labels} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LocaleSwitch locale={locale} />
          <NavbarAccountClient
            locale={locale}
            labels={{
              dashboard: t("dashboard"),
              profile: t("profile"),
              signOut: t("signOut"),
              signIn: t("signIn"),
              signUp: t("signUp"),
            }}
          />
        </div>
      </div>
      <div className="border-t border-[#eef0e8] 2xl:hidden">
        <div className="mx-auto max-w-7xl">
          <MainNav labels={labels} compact />
        </div>
      </div>
    </header>
  );
}
