"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  resourceSchema,
  formatResourceValidationError,
  type ResourceInput,
} from "@/lib/validation/resource";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export type { ResourceInput } from "@/lib/validation/resource";

export async function createResourceRecord(input: ResourceInput) {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: formatResourceValidationError(parsed.error) };
  }

  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);
  if (!identity) return { error: "Unauthorized." };

  if (
    parsed.data.source_type === "upload" &&
    (!parsed.data.storage_path.startsWith(identity.id + "/") ||
      parsed.data.storage_path.includes("://"))
  ) {
    return { error: "Invalid storage path." };
  }

  const row = parsed.data.source_type === "upload"
    ? {
        title: parsed.data.title,
        type: parsed.data.type,
        course_id: parsed.data.course_id,
        source_type: "upload",
        storage_path: parsed.data.storage_path,
        external_url: null,
        file_size: parsed.data.file_size,
        mime_type: parsed.data.mime_type,
        uploader_id: identity.id,
        status: "pending",
      }
    : {
        title: parsed.data.title,
        type: parsed.data.type,
        course_id: parsed.data.course_id,
        source_type: "external",
        storage_path: null,
        external_url: parsed.data.external_url,
        file_size: null,
        mime_type: null,
        uploader_id: identity.id,
        status: "pending",
      };

  const { error } = await supabase.from("resources").insert(row);

  if (error) {
    console.error("Resource insert failed:", error.code);
    return { error: "Failed to save the resource." };
  }

  revalidatePath("/resources");
  revalidatePath("/profile");
  return { success: true };
}
