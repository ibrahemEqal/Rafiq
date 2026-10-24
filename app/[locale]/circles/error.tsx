"use client";
import { useLocale } from "next-intl";
export default function ErrorPage({ retry }: { retry: () => void }) {
  const ar = useLocale() === "ar";
  return (
    <section
      role="alert"
      className="mx-auto my-12 max-w-xl rounded-3xl bg-paper p-7"
    >
      <h2 className="text-xl font-bold">
        {ar ? "تعذّر تحميل الساحة" : "The campus square could not be loaded"}
      </h2>
      <button
        onClick={retry}
        className="mt-5 rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white"
      >
        {ar ? "أعد المحاولة" : "Try again"}
      </button>
    </section>
  );
}
