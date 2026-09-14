"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/auth/login?error=true");
  }

  revalidatePath("/");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const full_name = formData.get("full_name") as string;
  const username = formData.get("username") as string;

  if (password !== confirmPassword) {
    return redirect("/auth/register?error=mismatch");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        username,
        preferred_language: 'ar',
      },
      emailRedirectTo: 'http://localhost:3000/auth/callback',
    }
  });

if (error) {
  console.error("Signup error:", error);

  return redirect(
    `/auth/register?error=${encodeURIComponent(error.message)}`
  );
}

  redirect("/auth/login?check_email=true");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}