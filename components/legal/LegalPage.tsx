import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function LegalPage({ kind }: { kind: "terms" | "privacy" | "copyright" }) {
  const t = await getTranslations(`Legal.${kind}`);
  const sections = t.raw("sections") as Array<{ heading: string; body: string }>;
  return <main className="min-h-screen bg-canvas px-4 py-10 sm:px-6 sm:py-16">
    <article className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-line bg-paper shadow-sm">
      <header className="bg-forest px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-paper/10 px-4 py-2 text-sm font-bold text-mist"><ShieldCheck size={17} aria-hidden="true" />{t("label")}</div>
        <h1 className="text-3xl font-bold sm:text-5xl">{t("title")}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-mist">{t("intro")}</p>
        <p className="mt-5 text-sm font-semibold text-mist">{t("updated")}</p>
      </header>
      <div className="space-y-9 px-6 py-9 sm:px-10 sm:py-12">
        {sections.map((section, index) => <section key={section.heading} className={index ? "border-t border-line-soft pt-8" : ""}><h2 className="text-xl font-bold text-ink sm:text-2xl">{section.heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-8 text-muted">{section.body}</p></section>)}
        <div className="border-t border-line-soft pt-8"><Link href="/" className="font-bold text-forest hover:text-forest">{t("backHome")}</Link></div>
      </div>
    </article>
  </main>;
}
