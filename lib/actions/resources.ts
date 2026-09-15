"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  resourceSchema,
  formatResourceValidationError,
  type ResourceInput,
} from "@/lib/validation/resource";

export type { ResourceInput } from "@/lib/validation/resource";

export async function createResourceRecord(input: ResourceInput) {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatResourceValidationError(parsed.error) };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  if (
    !parsed.data.storage_path.startsWith(user.id + "/") ||
    parsed.data.storage_path.includes("://")
  ) {
    return { error: "Invalid storage path." };
  }

  const { error } = await supabase.from("resources").insert({
    title: parsed.data.title,
    type: parsed.data.type,
    course_id: parsed.data.course_id,
    storage_path: parsed.data.storage_path,
    file_size: parsed.data.file_size,
    mime_type: parsed.data.mime_type,
    uploader_id: user.id,
    status: "pending",
  });

  if (error) {
    console.error("Resource insert failed:", error.code);
    return { error: "Failed to save the resource." };
  }

  revalidatePath("/resources");
  revalidatePath("/profile");
  return { success: true };
}
