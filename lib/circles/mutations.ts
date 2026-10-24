import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerifiedIdentity } from "../auth/identity.ts";
import {
  circleSchema,
  circleActionSchema,
  circleReportSchema,
  circleError,
  type CircleError,
} from "./model.ts";
export async function mutateCircleWithClient(
  client: SupabaseClient,
  operation: unknown,
  input: unknown,
  now = Date.now(),
) {
  try {
    if (!(await getVerifiedIdentity(client)))
      return { error: "unauthorized" as CircleError };
    if (operation === "create") {
      const parsed = circleSchema.safeParse(input);
      if (
        !parsed.success ||
        Date.parse(parsed.data.starts_at) < now - 60_000 ||
        Date.parse(parsed.data.starts_at) > now + 90 * 86400000
      )
        return { error: "invalid" as CircleError };
      const { data, error } = await client.rpc("create_campus_circle", {
        details: parsed.data,
      });
      if (error) return { error: circleError(error) };
      return data?.id
        ? { success: true as const, id: data.id as string }
        : { error: "failed" as CircleError };
    }
    if (operation === "report") {
      const parsed = circleReportSchema.safeParse(input);
      if (!parsed.success) return { error: "invalid" as CircleError };
      const { data, error } = await client.rpc("report_campus_circle", {
        target: parsed.data.id,
        report_reason: parsed.data.reason,
      });
      if (error) return { error: circleError(error) };
      return data?.id
        ? { success: true as const, id: data.id as string }
        : { error: "failed" as CircleError };
    }
    if (operation !== "act") return { error: "invalid" as CircleError };
    const parsed = circleActionSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" as CircleError };
    const { data, error } = await client.rpc("act_campus_circle", {
      target: parsed.data.id,
      operation: parsed.data.action,
    });
    if (error) return { error: circleError(error) };
    return data?.id
      ? { success: true as const, id: data.id as string }
      : { error: "failed" as CircleError };
  } catch {
    return { error: "failed" as CircleError };
  }
}
