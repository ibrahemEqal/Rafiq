"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createQuestionWithClient, createAnswerWithClient, updateQuestionWithClient,
  updateAnswerWithClient, deleteForumPostWithClient, createReportWithClient,
} from "@/lib/questions/mutations";

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

export async function updateQuestion(input: unknown) {
  const result = await updateQuestionWithClient(await createClient(), input);
  if ("success" in result) {
    revalidatePath("/[locale]/questions", "page");
    revalidatePath("/[locale]/questions/[id]", "page");
  }
  return result;
}

export async function updateAnswer(input: unknown) {
  const result = await updateAnswerWithClient(await createClient(), input);
  if ("success" in result) revalidatePath("/[locale]/questions/[id]", "page");
  return result;
}

export async function deleteForumPost(input: unknown) {
  const result = await deleteForumPostWithClient(await createClient(), input);
  // Question deletion navigates away client-side; these Supabase reads are not
  // cached. Re-render only for answer deletion, where the current thread stays.
  if ("success" in result && result.questionId) revalidatePath("/[locale]/questions/[id]", "page");
  return result;
}

export async function reportForumPost(input: unknown) {
  const result = await createReportWithClient(await createClient(), input);
  if ("success" in result) revalidatePath("/[locale]/dashboard/reports", "page");
  return result;
}
