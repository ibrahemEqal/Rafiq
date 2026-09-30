"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAllowedExternalResourceUrl } from "@/lib/validation/resource";

export async function createResourceDownload(resourceId: string) {
  const parsedId = z.string().uuid().safeParse(resourceId);
  if (!parsedId.success) return { error: "Invalid resource." };

  const supabase = await createClient();
  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, source_type, storage_path, external_url, title")
    .eq("id", parsedId.data)
    .eq("status", "approved")
    .single();

  if (error || !resource) return { error: "Resource not found." };

  if (resource.source_type === "external") {
    if (!resource.external_url || !isAllowedExternalResourceUrl(resource.external_url)) {
      return { error: "External resource link is unavailable." };
    }
    await supabase.rpc("increment_resource_download", { resource_id: parsedId.data });
    return { url: resource.external_url };
  }

  if (!resource.storage_path) return { error: "Download is unavailable." };

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
