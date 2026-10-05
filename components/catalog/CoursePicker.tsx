"use client";

import { useEffect, useId, useState } from "react";
import type { CatalogOption, CourseOption, CourseSelection } from "@/lib/catalog/types";
import { requirementForCode, universityRequirements } from "@/lib/catalog/university-requirements";

const labels = {
  ar: {
    scope: "نوع المساق", university: "مساقات إجباري الجامعة", majorCourses: "مساقات الكلية والتخصص",
    college: "الكلية", major: "التخصص", requirement: "متطلب الجامعة", course: "المساق ورمزه",
    choose: "اختر…", loading: "جارٍ تحميل المساقات…", error: "تعذّر تحميل القائمة. حاول مرة أخرى.",
    retry: "إعادة المحاولة", empty: "لا توجد مساقات متاحة لهذا الاختيار.",
    variants: "اختر الخيار المطابق لخطة كليتك؛ إنجليزي ١٠٢ مفصول حسب الكلية.",
    commonHint: "متطلبات الجامعة في قسم مستقل، وليست مكررة داخل التخصصات.",
  },
  en: {
    scope: "Course category", university: "University requirements", majorCourses: "College and major courses",
    college: "College", major: "Major", requirement: "University requirement", course: "Course and code",
    choose: "Choose…", loading: "Loading courses…", error: "Could not load this list. Please try again.",
    retry: "Retry", empty: "No courses are available for this selection.",
    variants: "Choose the option for your faculty. English 102 is separated by faculty.",
    commonHint: "University requirements have their own section, without repetition across majors.",
  },
};
type CatalogPayload = { majors?: CatalogOption[]; courses?: CourseOption[] };

function useCatalog(url: string | null) {
  const [result, setResult] = useState<{ url: string; payload?: CatalogPayload; failed?: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let active = true;
    fetch(url, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Catalog unavailable");
        const payload: CatalogPayload = await response.json();
        if (active) setResult({ url, payload });
      })
      .catch(error => {
        if (active && error?.name !== "AbortError") setResult({ url, failed: true });
      });
    return () => { active = false; controller.abort(); };
  }, [url, attempt]);
  const current = url && result?.url === url ? result : null;
  return {
    payload: current?.payload,
    failed: !!current?.failed,
    loading: !!url && !current,
    retry: () => { setResult(null); setAttempt(value => value + 1); },
  };
}

export default function CoursePicker({ colleges, locale, label, emptyLabel, name = "course_id", initial = null, required = false, disabled = false, includeCollegeId = false }: {
  colleges: CatalogOption[];
  locale: string;
  label: string;
  emptyLabel?: string;
  name?: string;
  initial?: CourseSelection | null;
  required?: boolean;
  disabled?: boolean;
  includeCollegeId?: boolean;
}) {
  const id = useId();
  const copy = labels[locale === "ar" ? "ar" : "en"];
  const localName = (item: { name_ar: string; name_en: string }) => locale === "ar" ? item.name_ar : item.name_en;
  const [scope, setScope] = useState(initial ? (initial.requirement ? "university" : "major") : "");
  const [collegeId, setCollegeId] = useState(initial?.college.id ?? "");
  const [majorId, setMajorId] = useState(initial?.major.id ?? "");
  const [requirement, setRequirement] = useState(initial?.requirement ?? "");
  const [courseId, setCourseId] = useState(initial?.course.id ?? "");
  const majors = useCatalog(scope === "major" && collegeId ? `/api/catalog?college_id=${collegeId}` : null);
  const courseUrl = scope === "major" && majorId ? `/api/catalog?major_id=${majorId}`
    : scope === "university" && requirement ? `/api/catalog?requirement=${requirement}` : null;
  const courses = useCatalog(courseUrl);
  const majorOptions = majors.payload?.majors ?? (initial && collegeId === initial.college.id ? [initial.major] : []);
  let courseOptions = courses.payload?.courses ?? (initial && courseId === initial.course.id ? [initial.course] : []);
  // Preserve an old post's ID when its visible canonical option represents the
  // same exact code or an explicitly collapsed legacy alias.
  if (initial && courseId === initial.course.id) {
    courseOptions = courseOptions.map(item => equivalentVisibleOption(item, initial.course) ? { ...item, id: initial.course.id } : item);
  }
  const selected = courseOptions.find(item => item.id === courseId);
  const requirementConfig = universityRequirements.find(item => item.key === requirement);
  const courseLabel = (item: CourseOption) => {
    const base = `${item.code} — ${localName(item)}`;
    const collegeNames = locale === "ar" ? item.college_names_ar : item.college_names_en;
    return scope === "university" && requirementConfig?.mode === "college" && collegeNames ? `${base} — ${collegeNames}` : base;
  };
  const field = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-60";
  function reset() { setCollegeId(""); setMajorId(""); setRequirement(""); setCourseId(""); }

  return <fieldset disabled={disabled} className="min-w-0 space-y-3">
    <legend className="mb-2 text-sm font-bold text-slate-700">{label}</legend>
    <label htmlFor={`${id}-scope`} className="sr-only">{copy.scope}</label>
    <select id={`${id}-scope`} value={scope} required={required} onChange={event => { setScope(event.target.value); reset(); }} className={field}>
      <option value="">{emptyLabel ?? copy.choose}</option>
      <option value="university">{copy.university}</option>
      <option value="major">{copy.majorCourses}</option>
    </select>
    {scope === "major" && <div className="grid gap-3 sm:grid-cols-2">
      <div><label htmlFor={`${id}-college`} className="mb-1 block text-xs font-semibold text-slate-500">{copy.college}</label>
        <select id={`${id}-college`} value={collegeId} required onChange={event => { setCollegeId(event.target.value); setMajorId(""); setCourseId(""); }} className={field}>
          <option value="">{copy.choose}</option>{colleges.map(item => <option key={item.id} value={item.id}>{localName(item)}</option>)}
        </select></div>
      <div><label htmlFor={`${id}-major`} className="mb-1 block text-xs font-semibold text-slate-500">{copy.major}</label>
        <select id={`${id}-major`} value={majorId} required onChange={event => { setMajorId(event.target.value); setCourseId(""); }} aria-busy={majors.loading} className={field}>
          <option value="">{majors.loading ? copy.loading : copy.choose}</option>{majorOptions.map(item => <option key={item.id} value={item.id}>{localName(item)}</option>)}
        </select></div>
    </div>}
    {scope === "university" && <div><label htmlFor={`${id}-requirement`} className="mb-1 block text-xs font-semibold text-slate-500">{copy.requirement}</label>
      <select id={`${id}-requirement`} value={requirement} required onChange={event => { setRequirement(event.target.value); setCourseId(""); }} className={field}>
        <option value="">{copy.choose}</option>{universityRequirements.map(item => <option key={item.key} value={item.key}>{localName(item)}</option>)}
      </select></div>}
    {scope ? <div><label htmlFor={`${id}-course`} className="mb-1 block text-xs font-semibold text-slate-500">{copy.course}</label>
      <select id={`${id}-course`} name={name} value={courseId} required onChange={event => setCourseId(event.target.value)} aria-busy={courses.loading} aria-describedby={`${id}-hint`} className={field}>
        <option value="">{courses.loading ? copy.loading : copy.choose}</option>
        {courseOptions.map(item => <option key={item.id} value={item.id}>{courseLabel(item)}</option>)}
      </select>
      <p id={`${id}-hint`} className="mt-2 text-xs leading-6 text-slate-500">{scope === "university" ? copy.variants : copy.commonHint}</p>
    </div> : <input type="hidden" name={name} value="" />}
    {includeCollegeId && <input type="hidden" name="college_id" value={selected?.college_id ?? ""} />}
    {(majors.loading || courses.loading) && <p role="status" className="text-xs text-slate-500">{copy.loading}</p>}
    {courses.payload && !courseOptions.length && <p role="status" className="text-xs text-slate-500">{copy.empty}</p>}
    {(majors.failed || courses.failed) && <p role="alert" className="text-sm text-red-700">{copy.error} <button type="button" onClick={() => { if (majors.failed) majors.retry(); if (courses.failed) courses.retry(); }} className="font-bold underline">{copy.retry}</button></p>}
  </fieldset>;
}

function equivalentVisibleOption(option: CourseOption, selected: CourseOption) {
  if (option.university_id !== selected.university_id) return false;
  if (option.code === selected.code) return true;
  const optionRequirement = requirementForCode(option.code, option.university_slug);
  const selectedRequirement = requirementForCode(selected.code, selected.university_slug);
  return optionRequirement?.mode === "single" && optionRequirement.key === selectedRequirement?.key;
}
