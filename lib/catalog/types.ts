export type CatalogOption = { id: string; name_ar: string; name_en: string; slug: string };
export type CourseOption = CatalogOption & { code: string; major_id: string; college_id: string; university_id: string; university_slug: string };
export type CourseSelection = {
  course: CourseOption;
  major: CatalogOption;
  college: CatalogOption;
  requirement: string | null;
};
