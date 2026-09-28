import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { z } from "zod";
import { readCatalogPages } from "@/lib/catalog/pagination";
import { NAJAH_SLUG, getUniversityRequirement, requirementForCode, universityRequirementCodes } from "@/lib/catalog/university-requirements";
import type { CatalogOption, CourseOption, CourseSelection } from "@/lib/catalog/types";

export type CatalogName = CatalogOption;
const courseColumns = "id, name_ar, name_en, slug, code, major_id, college_id, university_id, university_slug";

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { revalidate: 3600, tags: ["public-catalog-v2"] } }) },
  });
}

export async function getColleges() {
  const { data, error } = await client().from("colleges").select("id, name_ar, name_en, slug").order("name_ar");
  if (error) throw new Error("College catalog unavailable");
  return (data ?? []) as CatalogName[];
}

export async function getMajors(collegeId: string) {
  const { data, error } = await client().from("majors").select("id, name_ar, name_en, slug").eq("college_id", collegeId).order("name_ar");
  if (error) throw new Error("Major catalog unavailable");
  return (data ?? []) as CatalogName[];
}

export async function getCourses(majorId: string) {
  if (!z.guid().safeParse(majorId).success) throw new Error("A major is required");
  const catalog = client();
  const rows = await readCatalogPages<CourseOption>((from, to) => catalog.from("course_catalog_entries")
    .select(courseColumns).eq("major_id", majorId).order("code").order("id").range(from, to));
  return rows.filter(item => !requirementForCode(item.code, item.university_slug));
}

export async function getUniversityCourses(requirementKey?: string) {
  const requirement = getUniversityRequirement(requirementKey);
  if (requirementKey && !requirement) throw new Error("Unknown university requirement");
  const { data, error } = await client().from("course_catalog_options").select(courseColumns)
    .eq("university_slug", NAJAH_SLUG).in("code", requirement?.codes ?? universityRequirementCodes).order("code");
  if (error) throw new Error("University catalog unavailable");
  return (data ?? []) as CourseOption[];
}

export const getCourseSelection = cache(async (courseId?: string | null): Promise<CourseSelection | null> => {
  if (!courseId || !z.guid().safeParse(courseId).success) return null;
  const { data, error } = await client().from("course_catalog_entries")
    .select(`${courseColumns}, major_name_ar, major_name_en, major_slug, college_name_ar, college_name_en, college_slug`)
    .eq("id", courseId).maybeSingle();
  if (error) throw new Error("Course unavailable");
  if (!data) return null;
  return {
    course: { id: data.id, code: data.code, name_ar: data.name_ar, name_en: data.name_en, slug: data.slug, major_id: data.major_id, college_id: data.college_id, university_id: data.university_id, university_slug: data.university_slug },
    major: { id: data.major_id, name_ar: data.major_name_ar, name_en: data.major_name_en, slug: data.major_slug },
    college: { id: data.college_id, name_ar: data.college_name_ar, name_en: data.college_name_en, slug: data.college_slug },
    requirement: requirementForCode(data.code, data.university_slug)?.key ?? null,
  };
});

export async function getEquivalentCourseIds(courseId: string) {
  const selection = await getCourseSelection(courseId);
  if (!selection) return [courseId]; // A missing valid UUID must match nothing, not all records.
  const catalog = client();
  const rows = await readCatalogPages<{ id: string }>((from, to) => catalog.from("course_catalog_entries").select("id")
    .eq("university_id", selection.course.university_id).eq("code", selection.course.code).order("id").range(from, to));
  return rows.length ? rows.map(item => item.id) : [courseId];
}

export async function getCatalogPath(collegeId?: string, majorId?: string, courseId?: string) {
  const catalog = client();
  const [collegeResult, majorResult, courseResult] = await Promise.all([
    collegeId ? catalog.from("colleges").select("id, name_ar, name_en, slug").eq("id", collegeId).maybeSingle() : null,
    majorId ? catalog.from("majors").select("id, college_id, name_ar, name_en, slug").eq("id", majorId).maybeSingle() : null,
    courseId ? catalog.from("courses").select("id, major_id, code, name_ar, name_en, slug").eq("id", courseId).maybeSingle() : null,
  ]);
  const college = collegeResult?.data ?? null;
  const major = majorResult?.data ?? null;
  const course = courseResult?.data ?? null;
  if ((major && major.college_id !== college?.id) || (course && course.major_id !== major?.id)) return { college: null, major: null, course: null };
  return { college, major, course };
}

export async function getUploadCatalog() { return { colleges: await getColleges() }; }
