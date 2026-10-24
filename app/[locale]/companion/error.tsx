"use client";
import { useLocale } from "next-intl";
export default function ErrorPage({ retry }: { retry: () => void }) {
  const ar = useLocale() === "ar";
  return (
    <section
      role="alert"
      className="mx-auto my-12 max-w-xl rounded-3xl border border-amber-200 bg-white p-7"
    >
      <h2 className="text-xl font-bold">
        {ar ? "تعذّر تحميل مساحتك" : "Your space could not be loaded"}
      </h2>
      <p className="my-4 text-sm leading-7 text-slate-500">
        {ar
          ? "ما قدرنا نوصل لبيانات حسابك. حاول مجددًا حتى ما نستبدلها ببيانات فارغة."
          : "We could not reach your saved data. Try again; it has not been replaced with an empty plan."}
      </p>
      <button
        type="button"
        onClick={retry}
        className="rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white"
      >
        {ar ? "أعد المحاولة" : "Try again"}
      </button>
    </section>
  );
}
