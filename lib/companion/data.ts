import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  emptySnapshot,
  parseSection,
  databaseError,
  type Snapshot,
  type CompanionError,
  type Section,
} from "./model";
export async function loadCompanion(
  client: SupabaseClient,
  userId: string,
): Promise<
  | { snapshot: Snapshot; error?: never }
  | { error: CompanionError; snapshot?: never }
> {
  const { data, error } = await client
    .from("companion_sections")
    .select("section,payload,version")
    .eq("user_id", userId);
  if (error) return { error: databaseError(error) };
  const snapshot = emptySnapshot();
  for (const row of data ?? []) {
    const parsed = parseSection(row.section, row.payload);
    if (!parsed || !Number.isInteger(row.version) || row.version < 1)
      return { error: "failed" as const };
    Object.assign(snapshot.data, { [parsed.section]: parsed.payload });
    snapshot.versions[row.section as Section] = row.version;
  }
  return { snapshot };
}
