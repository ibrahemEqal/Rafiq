"use server";

import { createClient } from "@/lib/supabase/server";

export async function incrementDownload(resourceId: string) {
  const supabase = await createClient();
  
  const { data: current } = await supabase
    .from("resources")
    .select("download_count")
    .eq("id", resourceId)
    .single();

  if (current) {
    await supabase
      .from("resources")
      .update({ download_count: current.download_count + 1 })
      .eq("id", resourceId);
  }
}