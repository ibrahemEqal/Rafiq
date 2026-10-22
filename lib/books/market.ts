import { z } from "zod";

export function normalizeWhatsapp(value: unknown) {
  if (typeof value !== "string" || !/^\+?[\d\s().-]+$/.test(value.trim())) return null;
  let digits = value.replace(/\D/g, "").replace(/^00/, "");
  if (/^05[69]\d{7}$/.test(digits)) digits = `970${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export const bookSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000),
  type: z.enum(["book", "printed_slides"]),
  college_id: z.guid(),
  whatsapp_number: z.string().transform(normalizeWhatsapp).refine(value => value !== null),
});

export function bookFilters(params: Record<string, unknown>) {
  const rawPage = typeof params.page === "string" && /^\d{1,4}$/.test(params.page) ? Number(params.page) : 1;
  return {
    q: typeof params.q === "string" ? params.q.trim().slice(0, 80) : "",
    type: params.type === "book" || params.type === "printed_slides" ? params.type : "",
    college: typeof params.college === "string" && z.guid().safeParse(params.college).success ? params.college : "",
    sort: params.sort === "oldest" ? "oldest" : "newest",
    page: Math.min(1000, Math.max(1, rawPage)),
  };
}

export function bookTitlePattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

export function bookListHref(filters: ReturnType<typeof bookFilters>, changes: Record<string, string | number> = {}) {
  const params = new URLSearchParams();
  const values = { ...filters, ...changes };
  for (const [key, value] of Object.entries(values)) {
    if (value && !(key === "page" && value === 1) && !(key === "sort" && value === "newest")) params.set(key, String(value));
  }
  return `/books${params.size ? `?${params}` : ""}`;
}
