import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerifiedIdentity } from "../auth/identity.ts";
import { parseSection, databaseError, type CompanionError } from "./model.ts";
export async function saveCompanionWithClient(
  client: SupabaseClient,
  section: unknown,
  payload: unknown,
  version: unknown,
) {
  try {
    if (!(await getVerifiedIdentity(client)))
      return { error: "unauthorized" as CompanionError };
    const parsed = parseSection(section, payload);
    if (
      !parsed ||
      typeof version !== "number" ||
      !Number.isSafeInteger(version) ||
      version < 0 ||
      version > 2_000_000_000
    )
      return { error: "invalid" as CompanionError };
    const { data, error } = await client.rpc("save_companion_section", {
      section_name: parsed.section,
      content: parsed.payload,
      expected_version: version,
    });
    if (error) return { error: databaseError(error) };
    if (
      !data ||
      !Number.isInteger(data.version) ||
      data.version !== version + 1
    )
      return { error: "failed" as CompanionError };
    return {
      success: true as const,
      section: parsed.section,
      payload: parsed.payload,
      version: data.version as number,
    };
  } catch {
    return { error: "failed" as CompanionError };
  }
}
