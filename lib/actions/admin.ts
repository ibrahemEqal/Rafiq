"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicDataTags } from "@/lib/supabase/public";
import {
  moderateResourceWithClient,
  createAdminPreviewWithClient,
} from "@/lib/admin/resource-review";

export async function moderateResource(input: unknown) {
  const result = await moderateResourceWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/dashboard", "page");
    revalidatePath("/[locale]/resources", "page");
    revalidatePath("/[locale]/resources/[id]", "page");
    revalidatePath("/[locale]/profile", "page");
    revalidateTag(publicDataTags.resources, "max");
  }
  return result;
}

export async function createAdminPreview(resourceId: unknown) {
  return createAdminPreviewWithClient(await createClient(), resourceId);
}
