"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export default function AuthSubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return <button type="submit" disabled={status.pending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3.5 font-semibold text-white hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">
    {status.pending && <LoaderCircle size={18} className="animate-spin" />}{status.pending ? pending : idle}
  </button>;
}
