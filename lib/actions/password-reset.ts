"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localizedPath, parseLocale, resolveSiteOrigin } from "@/lib/auth/signup";
import { requestPasswordResetWithClient, updatePasswordWithClient } from "@/lib/auth/password-reset";

export async function requestPasswordReset(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const origin = resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, (await headers()).get("origin"));
  const target = origin ? `${origin}${localizedPath(locale, "/auth/callback")}?next=/auth/reset-password` : null;
  const code = await requestPasswordResetWithClient(await createClient(), formData.get("email"), target);
  redirect(localizedPath(locale, `/auth/forgot-password?result=${code}`));
}

export async function updatePassword(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const client = await createClient();
  const code = await updatePasswordWithClient(client, {
    password: formData.get("password"), confirmPassword: formData.get("confirmPassword"),
  });
  if (code === "updated") {
    // Finish recovery with an explicit login using the new password.
    await client.auth.signOut({ scope: "local" });
    redirect(localizedPath(locale, "/auth/login?password_updated=true"));
  }
  redirect(localizedPath(locale, `/auth/reset-password?error=${code}`));
}
