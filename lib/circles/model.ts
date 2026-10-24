import { z } from "zod";
export const circleSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(1200),
  kind: z.enum(["study", "exchange", "break"]),
  location: z.string().trim().min(3).max(120),
  starts_at: z.iso.datetime(),
  duration: z.number().int().min(15).max(240),
  capacity: z.number().int().min(2).max(12),
});
export const circleActionSchema = z.object({
  id: z.guid(),
  action: z.enum(["join", "leave", "close", "dismiss"]),
});
export const circleRow = circleSchema.extend({
  starts_at: z.iso.datetime({ offset: true }),
  id: z.guid(),
  host: z.string(),
  members: z.number().int().min(1),
  joined: z.boolean(),
  is_host: z.boolean(),
  status: z.enum(["open", "closed"]),
  can_moderate: z.boolean().default(false),
  reports: z.number().int().min(0).default(0),
  moderation_note: z.string().nullable().default(null),
});
export const circleReportSchema = z.object({
  id: z.guid(),
  reason: z.string().trim().min(10).max(1000),
});
export type CampusCircle = z.infer<typeof circleRow>;
export type CircleError =
  | "unauthorized"
  | "invalid"
  | "full"
  | "ended"
  | "limit"
  | "notFound"
  | "host"
  | "unavailable"
  | "failed";
export function circleError(error: {
  code?: string;
  message?: string;
}): CircleError {
  if (["PGRST202", "PGRST205", "42P01", "42883"].includes(error.code ?? ""))
    return "unavailable";
  for (const name of ["full", "ended", "limit", "notFound", "host"] as const)
    if (error.message?.includes(`circle_${name}`)) return name;
  if (error.code === "42501") return "unauthorized";
  return "failed";
}

// A malformed row submitted directly to the database must not take down the public square.
export function parseCircleList(value: unknown): CampusCircle[] | null {
  if (!Array.isArray(value) || value.length > 40) return null;
  return value.flatMap((item) => {
    const parsed = circleRow.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
