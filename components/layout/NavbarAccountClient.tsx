"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "@/i18n/routing";
import { ShieldCheck, User } from "lucide-react";
import SignOutButton from "./SignOutButton";

type Account = { email: string; isAdmin: boolean } | null;
type Labels = {
  dashboard: string;
  profile: string;
  signOut: string;
  signIn: string;
  signUp: string;
};

export default function NavbarAccountClient({
  locale,
  labels,
}: {
  locale: string;
  labels: Labels;
}) {
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const pathname = usePathname();
  const prefix = locale === "en" ? "/en" : "";

  useEffect(() => {
    const controller = new AbortController();
    let request = 0;
    function refresh() {
      const current = ++request;
      fetch("/api/account", { cache: "no-store", signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((value) => {
          if (current === request) setAccount(value?.account ?? null);
        })
        .catch((error) => {
          if (error?.name !== "AbortError" && current === request)
            setAccount(null);
        });
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  if (account === undefined) {
    return (
      <div
        aria-label="Loading account"
        aria-busy="true"
        className="h-10 w-10 rounded-full bg-sage-soft sm:w-48 motion-safe:animate-pulse"
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      {account?.isAdmin && (
        <Link
          href={`${prefix}/dashboard`}
          aria-label={labels.dashboard}
          title={labels.dashboard}
          className="inline-flex items-center gap-2 rounded-xl bg-sage-soft px-3 py-2 text-sm font-bold text-forest hover:bg-sage-soft"
        >
          <ShieldCheck size={18} />
          <span className="hidden sm:inline">{labels.dashboard}</span>
        </Link>
      )}
      <div className="flex items-center gap-2 border-s border-line ps-2 sm:ps-4">
        {account ? (
          <details className="relative group">
            <summary
              aria-label={labels.profile}
              className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1.5 hover:bg-sage-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-soft font-bold text-forest shadow-sm">
                {account.email.charAt(0).toUpperCase()}
              </span>
            </summary>
            <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-xl border border-line bg-paper shadow-sm">
              <div className="border-b border-line-soft p-2">
                <p className="truncate text-xs text-muted">
                  {account.email}
                </p>
              </div>
              <div className="p-1">
                <Link
                  href={`${prefix}/profile`}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-ink hover:bg-canvas"
                >
                  <User size={16} />
                  {labels.profile}
                </Link>
              </div>
              <div className="border-t border-line-soft p-1">
                <SignOutButton
                  label={labels.signOut}
                  home={prefix || "/"}
                  onSignedOut={() => setAccount(null)}
                />
              </div>
            </div>
          </details>
        ) : (
          <>
            <Link
              href={`${prefix}/auth/login`}
              aria-label={labels.signIn}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#244638] px-3 py-2 text-xs font-bold text-white"
            >
              <User size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{labels.signIn}</span>
            </Link>
            <Link
              href={`${prefix}/auth/register`}
              className="hidden rounded-full border border-line px-4 py-2.5 text-xs font-bold text-ink hover:bg-canvas lg:inline-flex"
            >
              {labels.signUp}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
