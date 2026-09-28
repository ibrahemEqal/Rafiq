// An-Najah university-wide requirements. Codes come from the imported official
// study plans. This is a navigation grouping, NOT an equivalency declaration:
// different codes (notably English 102) keep separate files and selections.
export const NAJAH_SLUG = "an-najah-national-university";
export const universityRequirements = [
  { key: "remedial-english", name_ar: "إنجليزي استدراكي", name_en: "Remedial English", codes: ["10032100", "10032103"] },
  { key: "english-101", name_ar: "إنجليزي ١٠١", name_en: "English 101", codes: ["11000103"] },
  { key: "english-102", name_ar: "إنجليزي ١٠٢", name_en: "English 102", codes: ["11000322", "11000323", "11000324", "11000325", "11000326", "11000327", "11000328", "11000329", "11000330"] },
  { key: "palestinian-studies", name_ar: "دراسات فلسطينية", name_en: "Palestinian Studies", codes: ["11000105", "11000114"] },
  { key: "islamic-culture", name_ar: "ثقافة إسلامية", name_en: "Islamic Culture", codes: ["11000101", "11000123"] },
  { key: "arabic-language", name_ar: "لغة عربية", name_en: "Arabic Language", codes: ["11000102", "11000122"] },
  { key: "community-service", name_ar: "خدمة المجتمع", name_en: "Community Service", codes: ["11000108", "11000109"] },
  { key: "leadership-communication", name_ar: "مهارات قيادة واتصال", name_en: "Leadership and Communication Skills", codes: ["11000117"] },
  { key: "computer-skills", name_ar: "علم ومهارات الحاسوب", name_en: "Computer Science and Skills", codes: ["11000126"] },
] as const;

export const universityRequirementCodes: readonly string[] = universityRequirements.flatMap(item => [...item.codes]);
export function getUniversityRequirement(key?: string | null) {
  return universityRequirements.find(item => item.key === key);
}
export function requirementForCode(code: string, universitySlug: string) {
  if (universitySlug !== NAJAH_SLUG) return undefined;
  return universityRequirements.find(item => (item.codes as readonly string[]).includes(code));
}
