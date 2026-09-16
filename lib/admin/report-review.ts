import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAdminAccess, type AdminError } from "./resource-review.ts";

export const reportStatuses = ["pending", "reviewed", "dismissed"] as const;
export type ReportStatus = (typeof reportStatuses)[number];

const transitions: Record<ReportStatus, readonly ReportStatus[]> = {
  pending: ["reviewed", "dismissed"],
  reviewed: ["pending"],
  dismissed: ["pending"],
};

const schema = z.object({
  reportId: z.guid(), expectedStatus: z.enum(reportStatuses), status: z.enum(reportStatuses),
}).refine(input => transitions[input.expectedStatus].includes(input.status));

export function parseReportFilters(input: Record<string, unknown>) {
  const status = z.enum(reportStatuses).safeParse(input.status);
  const page = typeof input.page === "string" && /^\d{1,6}$/.test(input.page) ? Number(input.page) : 1;
  return { status: status.success ? status.data : "pending" as const, page: Math.max(1, page) };
}

export async function moderateReportWithClient(client: SupabaseClient, input: unknown): Promise<{ success: true } | { error: AdminError }> {
  try {
    if (!(await getAdminAccess(client)).isAdmin) return { error: "unauthorized" };
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { reportId, expectedStatus, status } = parsed.data;
    const { data, error } = await client.from("reports").update({ status })
      .eq("id", reportId).eq("status", expectedStatus).select("id, status").maybeSingle();
    if (error) return { error: "failed" };
    if (!data) return { error: "conflict" };
    if (data.status !== status) return { error: "failed" };
    return { success: true };
  } catch {
    return { error: "failed" };
  }
}
