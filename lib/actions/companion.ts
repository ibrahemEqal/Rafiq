"use server";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { saveCompanionWithClient } from "@/lib/companion/mutations";
import { loadCompanion } from "@/lib/companion/data";
export async function saveCompanion(
  section: unknown,
  payload: unknown,
  version: unknown,
) {
  return saveCompanionWithClient(
    await createClient(),
    section,
    payload,
    version,
  );
}
export async function refreshCompanion() {
  const client = await createClient();
  const identity = await getVerifiedIdentity(client);
  if (!identity) return { error: "unauthorized" as const };
  return loadCompanion(client, identity.id);
}
