"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, User } from "lucide-react";
import SignOutButton from "./SignOutButton";

type Account = { email: string; isAdmin: boolean } | null;
type Labels = { dashboard: string; profile: string; signOut: string; signIn: string; signUp: string };

export default function NavbarAccountClient({ locale, labels }: { locale: string; labels: Labels }) {
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const prefix = locale === "en" ? "/en" : "";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((value) => setAccount(value?.account ?? null))
      .catch((error) => {
        if (error?.name !== "AbortError") setAccount(null);
      });
    return () => controller.abort();
  }, []);

  if (account === undefined) {
    return <div aria-label="Loading account" aria-busy="true" className="h-10 w-10 rounded-full bg-slate-100 sm:w-48 motion-safe:animate-pulse" />;
  }

  return <div className="flex items-center gap-3">
    {account?.isAdmin && <Link href={`${prefix}/dashboard`} aria-label={labels.dashboard} title={labels.dashboard} className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100">
      <ShieldCheck size={18} /><span className="hidden sm:inline">{labels.dashboard}</span>
    </Link>}
    <div className="hidden items-center gap-2 border-s border-slate-200 ps-4 sm:flex">
      {account ? <details className="relative group">
        <summary aria-label={labels.profile} className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1.5 hover:bg-slate-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700 shadow-sm">{account.email.charAt(0).toUpperCase()}</span>
        </summary>
        <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2"><p className="truncate text-xs text-slate-500">{account.email}</p></div>
          <div className="p-1"><Link href={`${prefix}/profile`} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><User size={16} />{labels.profile}</Link></div>
          <div className="border-t border-slate-100 p-1"><SignOutButton label={labels.signOut} home={prefix || "/"} onSignedOut={() => setAccount(null)} /></div>
        </div>
      </details> : <>
        <Link href={`${prefix}/auth/login`} className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-teal-600">{labels.signIn}</Link>
        <Link href={`${prefix}/auth/register`} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800">{labels.signUp}</Link>
      </>}
    </div>
  </div>;
}
