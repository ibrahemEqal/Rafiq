"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function createResourceDownload(resourceId: string) {
  const parsedId = z.string().uuid().safeParse(resourceId);
  if (!parsedId.success) return { error: "Invalid resource." };

  const supabase = await createClient();
  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, storage_path, title")
    .eq("id", parsedId.data)
    .single();

  if (error || !resource) return { error: "Resource not found." };

  const extension = resource.storage_path.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "");
  const downloadName = extension ? resource.title + "." + extension : resource.title;

  const [{ data: signed, error: signedError }] = await Promise.all([
    supabase.storage
      .from("resources")
      .createSignedUrl(resource.storage_path, 60, { download: downloadName }),
    supabase.rpc("increment_resource_download", { resource_id: parsedId.data }),
  ]);

  if (signedError || !signed?.signedUrl) return { error: "Download is unavailable." };
  return { url: signed.signedUrl };
}
