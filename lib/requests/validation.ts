import { z } from "zod";

export const requestTypes = ["book", "resource", "other"] as const;
export const requestStatuses = ["open", "fulfilled", "closed"] as const;

export const requestInputSchema = z.object({
  title: z.string().trim().min(5).max(140),
  description: z.string().trim().min(10).max(2000),
  type: z.enum(requestTypes),
  course_id: z.union([z.guid(), z.literal(""), z.null()]).transform(value => value || null),
});

export const responseInputSchema = z.object({
  request_id: z.guid(),
  body: z.string().trim().min(2).max(1000),
  whatsapp_number: z.string().trim().max(20).optional().default("").transform(value => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? digits : "invalid";
  }).refine(value => value !== "invalid"),
});

export const requestStatusInputSchema = z.object({
  request_id: z.guid(),
  status: z.enum(["open", "fulfilled", "closed"]),
});

export type RequestActionError = "unauthorized" | "invalid" | "notFound" | "closed" | "rateLimited" | "failed";

function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseRequestFilters(params: Record<string, string | string[] | undefined>) {
  const q = scalar(params.q).slice(0, 80);
  const type = requestTypes.includes(scalar(params.type) as typeof requestTypes[number])
    ? scalar(params.type) as typeof requestTypes[number]
    : null;
  const status = requestStatuses.includes(scalar(params.status) as typeof requestStatuses[number])
    ? scalar(params.status) as typeof requestStatuses[number]
    : "open";
  const courseCandidate = scalar(params.course);
  const course = z.guid().safeParse(courseCandidate).success ? courseCandidate : null;
  const parsedPage = Number.parseInt(scalar(params.page), 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 100) : 1;
  return { q, type, status, course, page };
}

export function mapRequestError(message: string): RequestActionError {
  if (/auth|required|jwt|permission|row-level security/i.test(message)) return "unauthorized";
  if (/rate_limited/i.test(message)) return "rateLimited";
  if (/open requests|closed/i.test(message)) return "closed";
  if (/check constraint|invalid input|violates/i.test(message)) return "invalid";
  return "failed";
}
