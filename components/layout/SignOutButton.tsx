"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

export default function SignOutButton() {
  const t = useTranslations("Navigation");

  return (
    <form action={signOut} className="w-full">
      <button 
        type="submit" 
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-start"
      >
        <LogOut size={16} />
        {t("signOut")}
      </button>
    </form>
  );
}