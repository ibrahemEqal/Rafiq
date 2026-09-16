import { z } from "zod";

export const questionSchema = z.object({
  title: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(8000),
  course_id: z.guid().nullable().default(null),
});
export const answerSchema = z.object({
  question_id: z.guid(),
  body: z.string().trim().min(2).max(8000),
});
export type QuestionError = "unauthorized" | "invalid" | "notFound" | "failed";
export type QuestionResult = { success: true; id: string } | { error: QuestionError };

export function parseQuestionFilters(input: Record<string, unknown>) {
  const q = typeof input.q === "string" ? input.q.trim().slice(0, 80) : "";
  const course = z.guid().safeParse(input.course);
  const page = typeof input.page === "string" && /^[1-9]\d{0,5}$/.test(input.page) ? Number(input.page) : 1;
  return { q, course: course.success ? course.data : undefined, page };
}
