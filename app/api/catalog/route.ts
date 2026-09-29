import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCourses, getMajors, getUniversityCourses } from "@/lib/data/catalog";
import { getUniversityRequirement } from "@/lib/catalog/university-requirements";

const id = z.guid();
export async function GET(request: NextRequest) {
  const collegeId = request.nextUrl.searchParams.get("college_id");
  const majorId = request.nextUrl.searchParams.get("major_id");
  const requirement = request.nextUrl.searchParams.get("requirement");
  const noCache = { "Cache-Control": "no-store" };
  // Exactly one bounded parent; this endpoint cannot dump the entire catalog.
  if ([collegeId, majorId, requirement].filter(value => value !== null).length !== 1) {
    return NextResponse.json({ error: "Choose one catalog parent" }, { status: 400, headers: noCache });
  }
  const headers = { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };
  try {
    if (requirement && getUniversityRequirement(requirement)) return NextResponse.json({ courses: await getUniversityCourses(requirement) }, { headers });
    if (majorId && id.safeParse(majorId).success) return NextResponse.json({ courses: await getCourses(majorId) }, { headers });
    if (collegeId && id.safeParse(collegeId).success) return NextResponse.json({ majors: await getMajors(collegeId) }, { headers });
    return NextResponse.json({ error: "Invalid catalog parent" }, { status: 400, headers: noCache });
  } catch {
    return NextResponse.json({ error: "Catalog temporarily unavailable" }, { status: 503, headers: noCache });
  }
}
