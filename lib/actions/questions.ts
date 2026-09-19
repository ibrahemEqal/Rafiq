"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicDataTags } from "@/lib/supabase/public";
import { createQuestionWithClient, createAnswerWithClient } from "@/lib/questions/mutations";

export async function createQuestion(input: unknown) {
  const result = await createQuestionWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/questions", "page");
    revalidateTag(publicDataTags.questions, "max");
  }
  return result;
}

export async function createAnswer(input: unknown) {
  const result = await createAnswerWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/questions/[id]", "page");
    revalidateTag(publicDataTags.questions, "max");
  }
  return result;
}
