"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const resourceSchema = z.object({
  title: z.string().trim().min(3).max(160),
  type: z.enum(["previous_exam", "summary", "lecture", "assignment", "notes", "other"]),
  college_id: z.string().uuid(),
  course_id: z.string().uuid(),
  storage_path: z.string().min(3).max(500),
  file_size: z.number().int().positive().max(25 * 1024 * 1024),
  mime_type: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
  ]),
});

export type ResourceInput = z.infer<typeof resourceSchema>;

export async function createResourceRecord(input: ResourceInput) {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid resource data." };

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
