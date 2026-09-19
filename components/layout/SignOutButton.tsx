"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

export default function SignOutButton({ label, home, onSignedOut }: { label: string; home: string; onSignedOut: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form action={() => startTransition(async () => {
      await signOut();
      onSignedOut();
      router.replace(home);
      router.refresh();
    })} className="w-full">
      <button 
        type="submit" 
        disabled={pending}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-start disabled:opacity-60"
      >
        <LogOut size={16} />
        {label}
      </button>
    </form>
  );
}
