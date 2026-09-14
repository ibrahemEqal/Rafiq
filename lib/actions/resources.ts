"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createResourceRecord(data: {
  title: string;
  type: string;
  college_id: string; 
  course_id: string;
  file_url: string;
  file_size: number;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("resources").insert({
    title: data.title,
    type: data.type,
    course_id: data.course_id,
    storage_path: data.file_url, 
    file_size: data.file_size,
    uploader_id: userData.user.id,
    status: "pending", 
  });

  if (error) {
    console.error("DB Insert Error:", error.message);
    return { error: "Failed to save resource record." };
  }

  revalidatePath("/resources");
  return { success: true };
}