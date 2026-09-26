import "server-only";
import { createClient } from "@supabase/supabase-js";

export type CatalogName = { id: string; name_ar: string; name_en: string; slug: string };

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { revalidate: 3600, tags: ["public-catalog"] } }) },
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

export async function getCourses(majorId?: string) {
  let query = client().from("courses").select("id, name_ar, name_en, slug, code, major_id").order("code");
  if (majorId) query = query.eq("major_id", majorId);
  const { data, error } = await query;
  if (error) throw new Error("Course catalog unavailable");
  return data ?? [];
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
