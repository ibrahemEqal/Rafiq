"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { localizedPath, parseLocale, resolveSiteOrigin, signUpWithClient } from "@/lib/auth/signup";

export async function signIn(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(localizedPath(locale, "/auth/login?error=true"));
  }

  revalidatePath("/");
  redirect(localizedPath(locale, "/"));
}

export async function signUp(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const supabase = await createClient();
  const requestOrigin = (await headers()).get("origin");
  const origin = resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, requestOrigin);
  const result = await signUpWithClient(
    supabase,
    {
      locale,
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      full_name: formData.get("full_name"),
      username: formData.get("username"),
    },
    origin,
  );
  if (result.code === "check_email") redirect(localizedPath(locale, "/auth/login?check_email=true"));
  if (result.code === "account_ready") {
    revalidatePath("/");
    redirect(localizedPath(locale, "/auth/login?account_ready=true"));
  }
  redirect(localizedPath(locale, `/auth/register?error=${result.code}`));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
