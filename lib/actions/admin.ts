"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  }
  return result;
}

export async function createAdminPreview(resourceId: unknown) {
  return createAdminPreviewWithClient(await createClient(), resourceId);
}
