// An-Najah university-wide requirements. Codes come from the imported official
// study plans. English 102 codes stay separate because their material differs
// by faculty. Explicit legacy aliases for Arabic/Islamic/Palestinian courses
// collapse to one visible option while retaining every linked upload.
export const NAJAH_SLUG = "an-najah-national-university";
export const universityRequirements = [
  { key: "remedial-english", name_ar: "إنجليزي استدراكي", name_en: "Remedial English", codes: ["10032100", "10032103"], canonicalCode: "10032100", mode: "variants" },
  { key: "english-101", name_ar: "إنجليزي ١٠١", name_en: "English 101", codes: ["11000103"], canonicalCode: "11000103", mode: "single" },
  { key: "english-102", name_ar: "إنجليزي ١٠٢", name_en: "English 102", codes: ["11000322", "11000323", "11000324", "11000325", "11000326", "11000327", "11000328", "11000329", "11000330"], canonicalCode: "11000322", mode: "college" },
  { key: "palestinian-studies", name_ar: "دراسات فلسطينية", name_en: "Palestinian Studies", codes: ["11000105", "11000114"], canonicalCode: "11000105", mode: "single" },
  { key: "islamic-culture", name_ar: "ثقافة إسلامية", name_en: "Islamic Culture", codes: ["11000101", "11000123"], canonicalCode: "11000101", mode: "single" },
  { key: "arabic-language", name_ar: "لغة عربية", name_en: "Arabic Language", codes: ["11000102", "11000122"], canonicalCode: "11000102", mode: "single" },
  { key: "community-service", name_ar: "خدمة المجتمع", name_en: "Community Service", codes: ["11000108", "11000109"], canonicalCode: "11000108", mode: "variants" },
  { key: "leadership-communication", name_ar: "مهارات قيادة واتصال", name_en: "Leadership and Communication Skills", codes: ["11000117"], canonicalCode: "11000117", mode: "single" },
  { key: "computer-skills", name_ar: "علم ومهارات الحاسوب", name_en: "Computer Science and Skills", codes: ["11000126"], canonicalCode: "11000126", mode: "single" },
] as const;

export const universityRequirementCodes: readonly string[] = universityRequirements.flatMap(item => [...item.codes]);
export function getUniversityRequirement(key?: string | null) {
  return universityRequirements.find(item => item.key === key);
}
export function requirementForCode(code: string, universitySlug: string) {
  if (universitySlug !== NAJAH_SLUG) return undefined;
  return universityRequirements.find(item => (item.codes as readonly string[]).includes(code));
}

export function collapseUniversityCourseOptions<T extends { code: string; university_slug: string }>(rows: T[]) {
  const result: T[] = [];
  const singlePositions = new Map<string, number>();
  for (const row of rows) {
    const requirement = requirementForCode(row.code, row.university_slug);
    if (requirement?.mode !== "single") {
      result.push(row);
      continue;
    }
    const position = singlePositions.get(requirement.key);
    if (position === undefined) {
      singlePositions.set(requirement.key, result.length);
      result.push(row);
    } else if (row.code === requirement.canonicalCode) {
      result[position] = row;
    }
  }
  return result;
}
