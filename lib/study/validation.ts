import { z } from "zod";

export const setSchema = z.object({
  title: z.string().trim().min(3).max(160),
  subject: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2000).default(""),
  visibility: z.enum(["private", "shared"]).default("private"),
});
export const updateSetSchema = setSchema.extend({ id: z.guid() });
export const cardSchema = z.object({ set_id: z.guid(), front: z.string().trim().min(1).max(800), back: z.string().trim().min(1).max(2000) });
export const updateCardSchema = cardSchema.extend({ id: z.guid() });
export const targetSchema = z.object({ id: z.guid(), set_id: z.guid() });

export function safeMaterialUrl(value: string) {
  if (/^\/resources\/[a-fA-F0-9-]{36}$/.test(value)) return z.guid().safeParse(value.split("/")[2]).success;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}
export const materialSchema = z.object({ set_id: z.guid(), title: z.string().trim().min(2).max(160), url: z.string().trim().max(1200).refine(safeMaterialUrl) });
export const reviewSchema = z.object({ card_id: z.guid(), remembered: z.boolean(), token: z.guid().nullable().default(null) });
export type StudyError = "unauthorized" | "invalid" | "notFound" | "limit" | "unavailable" | "failed";
export type StudyResult = { success: true; id: string } | { error: StudyError };
export type StudyCard = { id: string; front: string; back: string };
export type StudyMaterial = { id: string; title: string; url: string };
export type StudySet = { id: string; title: string; subject: string; description: string; visibility: "private" | "shared"; share_token?: string; cards: StudyCard[]; materials: StudyMaterial[] };
export type StudyReview = { card_id: string; remembered: boolean; next_review_at: string };

export function studyDatabaseError(error: { code?: string; message?: string }): StudyError {
  if (error.code === "PGRST205" || error.code === "PGRST202" || error.code === "42P01") return "unavailable";
  if (error.message?.includes("study_limit")) return "limit";
  if (error.code === "42501") return "notFound";
  return "failed";
}
