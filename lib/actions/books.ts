"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { publicDataTags } from "@/lib/supabase/public";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export async function createBookRecord(formData: FormData) {
  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return { error: "Unauthorized" };

  const { error } = await supabase.from("books").insert({
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    type: formData.get("type") as string,
    college_id: formData.get("college_id") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    owner_id: identity.id,
    status: "available"
  });

  if (error) {
    console.error("DB Insert Error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/books");
  revalidateTag(publicDataTags.books, "max");
  return { success: true };
}
export async function markBookAsTaken(bookId: string) {
  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("books")
    .update({ status: "taken" })
    .eq("id", bookId)
    .eq("owner_id", identity.id);

  if (error) {
    console.error("Update Error:", error.message);
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/books");
  revalidateTag(publicDataTags.books, "max");
  return { success: true };
}
