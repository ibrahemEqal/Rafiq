import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const localeSchema = z.enum(["ar", "en"]);
const signupSchema = z.object({
  locale: localeSchema,
  full_name: z.string().trim().min(2).max(100),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
}).refine(input => input.password === input.confirmPassword, { path: ["confirmPassword"] });

export type SignupCode = "check_email" | "account_ready" | "mismatch" | "invalid" | "email_exists" | "rate_limited" | "failed" | "config";

export function parseLocale(value: unknown): "ar" | "en" {
  const parsed = localeSchema.safeParse(value);
  return parsed.success ? parsed.data : "ar";
}

export function localizedPath(locale: "ar" | "en", path: string) {
  return locale === "en" ? `/en${path}` : path;
}

export function resolveSiteOrigin(configured: string | undefined, requestOrigin: string | null) {
  for (const candidate of [configured, requestOrigin]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
      if ((url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password) return url.origin;
    } catch {}
  }
  return null;
}

function authErrorCode(error: { code?: string; status?: number } | null): SignupCode {
  if (!error) return "failed";
  if (error.code === "user_already_exists" || error.code === "email_exists") return "email_exists";
  if (error.code === "over_email_send_rate_limit" || error.status === 429) return "rate_limited";
  if (["email_address_invalid", "weak_password", "validation_failed"].includes(error.code ?? "")) return "invalid";
  return "failed";
}

export async function signUpWithClient(client: SupabaseClient, input: unknown, origin: string | null): Promise<{ code: SignupCode }> {
  if (!origin) return { code: "config" };
  if (input && typeof input === "object" && "password" in input && "confirmPassword" in input && input.password !== input.confirmPassword) return { code: "mismatch" };
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { code: "invalid" };
  const { locale, full_name, username, email, password } = parsed.data;
  try {
    // Supabase can resend confirmation for an unconfirmed existing account,
    // returning non-empty identities. Check existence before calling signUp.
    const lookup = await client.rpc("signup_email_exists", { candidate_email: email });
    const migrationPending = lookup.error?.code === "PGRST202" || lookup.error?.code === "42883";
    // Roll out code before the additive migration without taking signup down.
    // Auth still enforces uniqueness; the exact unconfirmed-email check starts
    // working once the migration is applied. All other lookup failures stop.
    if (lookup.error && !migrationPending) return { code: "failed" };
    if (lookup.data === true) return { code: "email_exists" };
    if (!migrationPending && lookup.data !== false) return { code: "failed" };
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, username, preferred_language: locale },
        emailRedirectTo: `${origin}${localizedPath(locale, "/auth/callback")}`,
      },
    });
    if (error) return { code: authErrorCode(error) };
    // With email enumeration protection Supabase can return a fake user with
    // no identities for an existing address. Do not claim an email was sent.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return { code: "email_exists" };
    if (data.session && data.user) return { code: "account_ready" };
    if (!data.user || !Array.isArray(data.user.identities) || !data.user.identities.length) return { code: "failed" };
    return { code: "check_email" };
  } catch {
    return { code: "failed" };
  }
}
