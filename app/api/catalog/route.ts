import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCourses, getMajors } from "@/lib/data/catalog";

const id = z.uuid();
export async function GET(request: NextRequest) {
  const collegeId = request.nextUrl.searchParams.get("college_id");
  const majorId = request.nextUrl.searchParams.get("major_id");
  const headers = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };
  if (majorId && id.safeParse(majorId).success) return NextResponse.json({ courses: await getCourses(majorId) }, { headers });
  if (collegeId && id.safeParse(collegeId).success) return NextResponse.json({ majors: await getMajors(collegeId) }, { headers });
  return NextResponse.json({ error: "Invalid catalog parent" }, { status: 400 });
}
