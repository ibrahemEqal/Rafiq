import type { SupabaseClient } from "@supabase/supabase-js";

export type VerifiedIdentity = { id: string; email: string | null };

// getClaims verifies the JWT signature. With Supabase asymmetric signing keys
// this stays local after the JWKS cache is warm, unlike getUser's mandatory
// Auth server round-trip. RLS remains the final authorization boundary.
export async function getVerifiedIdentity(client: SupabaseClient): Promise<VerifiedIdentity | null> {
  const { data, error } = await client.auth.getClaims();
  if (error) return null;
  const claims = data?.claims;
  const id = typeof claims?.sub === "string" ? claims.sub : null;
  if (!id) return null;
  return { id, email: typeof claims?.email === "string" ? claims.email : null };
}
