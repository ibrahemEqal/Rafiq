"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";

export default function ResourcesError({ reset }: { reset: () => void }) {
  const ar = useLocale() === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <section role="alert" className="mx-auto my-12 w-full max-w-2xl rounded-3xl border border-red-100 bg-paper p-6 sm:p-8">
    <h2 className="text-xl font-bold text-ink">{ar ? "تعذّر تحميل المصادر التعليمية" : "Learning resources could not be loaded"}</h2>
    <p className="my-4 leading-7 text-muted">{ar ? "ما قدرنا نحمّل البيانات حاليًا. أعد المحاولة؛ هذه الرسالة لا تعني أن المساق خالٍ من الموارد." : "We could not load the data right now. Try again; this does not mean the course has no resources."}</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })} className="rounded-xl bg-forest px-5 py-3 font-bold text-white disabled:opacity-60">{pending ? (ar ? "جارٍ التحميل…" : "Loading…") : (ar ? "أعد المحاولة" : "Try again")}</button>
      <Link href="/resources" className="px-4 py-3 font-bold text-forest">{ar ? "كل المصادر" : "All resources"}</Link>
    </div>
  </section>;
}
