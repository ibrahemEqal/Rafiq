"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createQuestionWithClient, createAnswerWithClient } from "@/lib/questions/mutations";

export async function createQuestion(input: unknown) {
  const result = await createQuestionWithClient(await createClient(), input);
  if ("success" in result) revalidatePath("/[locale]/questions", "page");
  return result;
}

export async function createAnswer(input: unknown) {
  const result = await createAnswerWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/questions/[id]", "page");
  }
  return result;
}
