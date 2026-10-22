"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mutateStudyWithClient, reviewCardWithClient } from "@/lib/study/mutations";

export async function mutateStudy(operation: Parameters<typeof mutateStudyWithClient>[1], input: unknown) {
  // The operation is an untrusted Server Action argument as well as a TS type.
  if (!["createSet", "updateSet", "deleteSet", "addCard", "updateCard", "deleteCard", "addMaterial", "deleteMaterial"].includes(operation)) return { error: "invalid" as const };
  const result = await mutateStudyWithClient(await createClient(), operation, input);
  if ("success" in result) revalidatePath("/[locale]/study", "layout");
  return result;
}

export async function reviewStudyCard(input: unknown) {
  const result = await reviewCardWithClient(await createClient(), input);
  if ("success" in result) revalidatePath("/[locale]/study", "layout");
  return result;
}
