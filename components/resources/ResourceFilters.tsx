import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function ResourceFilters({
  selectedType,
  query,
  collegeId,
  majorId,
  courseId,
}: {
  selectedType?: string;
  query?: string;
  collegeId: string;
  majorId: string;
  courseId: string;
}) {
  const t = await getTranslations("Resources");

  return (
    <form method="get" className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{t("filters")}</h2>
        <Link href={`/resources?college=${collegeId}&major=${majorId}&course=${courseId}`} className="text-sm font-medium text-slate-400 hover:text-teal-600">
          {t("clearFilters")}
        </Link>
      </div>
      {query && <input type="hidden" name="q" value={query} />}
      <input type="hidden" name="college" value={collegeId} />
      <input type="hidden" name="major" value={majorId} />
      <input type="hidden" name="course" value={courseId} />
      <fieldset className="space-y-2">
        <legend className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">{t("fileType")}</legend>
        {[
          ["", t("all")],
          ["summary", t("summaries")],
          ["previous_exam", t("exams")],
          ["lecture", t("lectures")],
        ].map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-3">
            <input type="radio" name="type" value={value} defaultChecked={(selectedType ?? "") === value} className="h-4 w-4 accent-teal-600" />
            <span className="text-sm font-medium text-slate-600">{label}</span>
          </label>
        ))}
      </fieldset>
      <button type="submit" className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
        {t("filters")}
      </button>
    </form>
  );
}
