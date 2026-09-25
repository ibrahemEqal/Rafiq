"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicDataTags } from "@/lib/supabase/public";
import {
  createRequestResponseWithClient,
  createRequestWithClient,
  updateRequestStatusWithClient,
} from "@/lib/requests/mutations";

export async function createRequest(input: unknown) {
  const result = await createRequestWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/requests", "page");
    revalidateTag(publicDataTags.requests, "max");
  }
  return result;
}

export async function createRequestResponse(input: unknown) {
  const result = await createRequestResponseWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/requests/[id]", "page");
    revalidateTag(publicDataTags.requests, "max");
    revalidateTag(publicDataTags.request_responses, "max");
  }
  return result;
}

export async function updateRequestStatus(input: unknown) {
  const result = await updateRequestStatusWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/requests", "page");
    revalidatePath("/[locale]/requests/[id]", "page");
    revalidateTag(publicDataTags.requests, "max");
  }
  return result;
}
