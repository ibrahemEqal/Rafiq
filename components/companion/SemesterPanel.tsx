"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  GraduationCap,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { semesterProjection } from "@/lib/companion/math";
import type { CompanionData } from "@/lib/companion/model";
import { Field, fieldClass, saveClass } from "./fields";
export default function SemesterPanel({
  plan,
  onSave,
  busy,
}: {
  plan: CompanionData["semester"];
  onSave: (plan: CompanionData["semester"]) => Promise<boolean>;
  busy: boolean;
}) {
  const t = useTranslations("Companion");
  const [draft, setDraft] = useState(plan);
  const projection = semesterProjection(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(plan);
  function change(
    key: "previousCredits" | "previousAverage" | "target",
    value: string,
  ) {
    setDraft((previous) => ({ ...previous, [key]: Number(value) }));
  }
  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("course") ?? "").trim();
    if (!title || draft.courses.length >= 20) return;
    setDraft((previous) => ({
      ...previous,
      courses: [
        ...previous.courses,
        {
          id: crypto.randomUUID(),
          title,
          credits: Number(form.get("credits")),
          points: 0,
        },
      ],
    }));
    event.currentTarget.reset();
  }
  return (
    <div className="space-y-6">
      <section className="companion-paper p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="companion-eyebrow">
              <GraduationCap size={15} aria-hidden="true" />
              {t("semesterEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-bold">{t("semesterTitle")}</h2>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800">
            {t("simulation")}
          </span>
        </div>
        <p className="mb-6 max-w-3xl text-sm leading-7 text-slate-500">
          {t("semesterHint")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field id="grade-scale" label={t("gradeScale")}>
            <select
              id="grade-scale"
              className={fieldClass}
              value={draft.scale}
              onChange={(event) => {
                if (window.confirm(t("scaleReset")))
                  setDraft((previous) => ({
                    ...previous,
                    scale: Number(event.target.value) as 4 | 100,
                    previousAverage: 0,
                    target: Number(event.target.value) === 4 ? 3 : 80,
                    courses: previous.courses.map((course) => ({
                      ...course,
                      points: 0,
                    })),
                  }));
              }}
            >
              <option value="4">4.00</option>
              <option value="100">100</option>
            </select>
          </Field>
          <Field id="previous-credits" label={t("previousCredits")}>
            <input
              id="previous-credits"
              type="number"
              min={0}
              max={400}
              step="0.5"
              className={fieldClass}
              value={draft.previousCredits}
              onChange={(event) =>
                change("previousCredits", event.target.value)
              }
            />
          </Field>
          <Field id="previous-average" label={t("previousAverage")}>
            <input
              id="previous-average"
              type="number"
              min={0}
              max={draft.scale}
              step="0.01"
              className={fieldClass}
              value={draft.previousAverage}
              onChange={(event) =>
                change("previousAverage", event.target.value)
              }
            />
          </Field>
          <Field id="target-average" label={t("targetAverage")}>
            <input
              id="target-average"
              type="number"
              min={0}
              max={draft.scale}
              step="0.01"
              className={fieldClass}
              value={draft.target}
              onChange={(event) => change("target", event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["semesterPoints", projection.semester],
            ["projectedPoints", projection.projected],
            ["semesterCredits", projection.credits],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-[#f2f5ee] p-5">
              <p className="text-xs font-bold text-slate-500">
                {t(String(label))}
              </p>
              <p
                dir="ltr"
                className="mt-3 text-start text-3xl font-bold text-[#183d34]"
              >
                {value === null
                  ? "—"
                  : Number(value).toFixed(label === "semesterCredits" ? 1 : 2)}
              </p>
            </div>
          ))}
        </div>
        {projection.required !== null && (
          <p
            role="status"
            className="mt-4 rounded-xl bg-violet-50 p-4 text-sm leading-7 text-violet-900"
          >
            {projection.required > draft.scale
              ? t("targetBeyondRange")
              : projection.required < 0
                ? t("targetAlreadyCovered")
                : t("targetRequired", {
                    points: projection.required.toFixed(2),
                    scale: draft.scale,
                  })}
          </p>
        )}
      </section>
      <section className="companion-paper p-5 sm:p-7">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
          <SlidersHorizontal size={19} aria-hidden="true" />
          {t("tryYourGrades")}
        </h3>
        {draft.courses.length ? (
          <div className="space-y-4">
            {draft.courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 dir="auto" className="font-bold">
                      {course.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("creditCount", { count: course.credits })}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={t("deleteNamed", { name: course.title })}
                    onClick={() =>
                      setDraft((previous) => ({
                        ...previous,
                        courses: previous.courses.filter(
                          (item) => item.id !== course.id,
                        ),
                      }))
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="range"
                    aria-label={t("pointsFor", { name: course.title })}
                    min={0}
                    max={draft.scale}
                    step={draft.scale === 4 ? 0.05 : 1}
                    value={course.points}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        courses: previous.courses.map((item) =>
                          item.id === course.id
                            ? { ...item, points: Number(event.target.value) }
                            : item,
                        ),
                      }))
                    }
                    className="min-w-0 flex-1 accent-emerald-700"
                  />
                  <output className="min-w-16 rounded-lg bg-emerald-50 px-3 py-2 text-center font-bold text-emerald-800">
                    {course.points.toFixed(draft.scale === 4 ? 2 : 0)}
                  </output>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="companion-empty">{t("noSemesterCourses")}</p>
        )}
        <form
          onSubmit={add}
          className="mt-6 grid items-end gap-3 border-t border-slate-100 pt-6 sm:grid-cols-[1fr_110px_auto]"
        >
          <Field id="course-name" label={t("courseName")}>
            <input
              id="course-name"
              name="course"
              maxLength={100}
              required
              className={fieldClass}
            />
          </Field>
          <Field id="course-credits" label={t("credits")}>
            <input
              id="course-credits"
              name="credits"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              defaultValue={3}
              required
              className={fieldClass}
            />
          </Field>
          <button disabled={draft.courses.length >= 20} className={saveClass}>
            <Plus size={17} aria-hidden="true" />
            {t("add")}
          </button>
        </form>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || !dirty}
            onClick={() => onSave(draft)}
            className={saveClass}
          >
            {t(busy ? "saving" : "saveSemester")}
          </button>
          <button
            type="button"
            onClick={() => setDraft(plan)}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500"
          >
            <RotateCcw size={14} aria-hidden="true" />
            {t("restoreSaved")}
          </button>
          {dirty && (
            <span className="text-xs font-bold text-amber-800">
              {t("unsavedSimulation")}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
