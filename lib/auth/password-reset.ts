import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const emailSchema = z.string().trim().max(254).pipe(z.email());
const passwordSchema = z.object({
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
}).refine(value => value.password === value.confirmPassword);

type RecoveryClient = Pick<SupabaseClient, "auth">;
export type RecoveryCode = "sent" | "invalid" | "rate_limited" | "failed" | "config";
export type PasswordUpdateCode = "updated" | "invalid" | "expired" | "failed";

export async function requestPasswordResetWithClient(client: RecoveryClient, email: unknown, redirectTo: string | null): Promise<RecoveryCode> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return "invalid";
  if (!redirectTo) return "config";
  try {
    const { error } = await client.auth.resetPasswordForEmail(parsed.data, { redirectTo });
    if (error?.status === 429 || error?.code === "over_email_send_rate_limit") return "rate_limited";
    // Use the same acknowledgement for nonexistent and existing accounts.
    if (error) return "failed";
    return "sent";
  } catch { return "failed"; }
}

export async function updatePasswordWithClient(client: RecoveryClient, input: unknown): Promise<PasswordUpdateCode> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return "invalid";
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return "expired";
    const result = await client.auth.updateUser({ password: parsed.data.password });
    if (result.error?.code === "weak_password" || result.error?.code === "same_password") return "invalid";
    if (result.error) return "failed";
    return "updated";
  } catch { return "failed"; }
}

// A recovery callback may only continue to this local page; never trust a URL
// supplied by a query parameter as an open redirect destination.
export function isPasswordRecovery(params: URLSearchParams) {
  return params.get("next") === "/auth/reset-password" || params.get("type") === "recovery";
}
