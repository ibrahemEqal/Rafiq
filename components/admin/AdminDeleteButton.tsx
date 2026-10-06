"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Trash2, LoaderCircle } from "lucide-react";
import { deleteAnyContent } from "@/lib/actions/admin-content";
export default function AdminDeleteButton({ kind, id, label }: { kind: "book" | "request" | "question" | "answer" | "comment"; id: string; label: string }) {
  const [busy, setBusy] = useState(false); const router = useRouter();
  async function remove() { if (busy || !window.confirm(label)) return; setBusy(true); const result = await deleteAnyContent({ kind, id }); if ("error" in result) window.alert(result.error); else router.refresh(); setBusy(false); }
  return <button type="button" onClick={remove} disabled={busy} className="relative z-10 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-60">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />} {label}</button>;
}
