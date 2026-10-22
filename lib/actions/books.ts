"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { publicDataTags } from "@/lib/supabase/public";
import { bookSchema } from "@/lib/books/market";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export async function createBookRecord(formData: FormData) {
  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return { error: "unauthorized" };

  const parsed = bookSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    type: formData.get("type"),
    college_id: formData.get("college_id"),
    whatsapp_number: formData.get("whatsapp_number"),
  });
  if (!parsed.success) return { error: "invalid" };
  const { error } = await supabase.from("books").insert({
    ...parsed.data,
    owner_id: identity.id,
    status: "available"
  });

  if (error) {
    console.error("Book insert failed:", error.code);
    return { error: "failed" };
  }

  revalidatePath("/[locale]/books", "page");
  updateTag(publicDataTags.books);
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
  revalidatePath("/[locale]/books", "page");
  updateTag(publicDataTags.books);
  return { success: true };
}
