import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getVerifiedIdentity } from "../auth/identity.ts";
import type { QuestionError } from "./validation.ts";

const reactionSchema = z.object({ answer_id: z.guid(), active: z.boolean() });
const commentSchema = z.object({ answer_id: z.guid(), body: z.string().trim().min(2).max(1000) });
const deleteCommentSchema = z.object({ comment_id: z.guid() });

type InteractionResult = { success: true; active?: boolean; id?: string } | { error: QuestionError };

function databaseError(error: unknown): QuestionError {
  if (!error || typeof error !== "object") return "failed";
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  if (message.includes("forum_rate_limited")) return "rateLimited";
  if (/row-level security|permission|forbidden/i.test(message)) return "forbidden";
  return "failed";
}

export async function setAnswerReactionWithClient(client: SupabaseClient, input: unknown): Promise<InteractionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = reactionSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };

    const { data: answer, error: answerError } = await client.from("answers")
      .select("id, author_id").eq("id", parsed.data.answer_id).maybeSingle();
    if (answerError) return { error: "failed" };
    if (!answer) return { error: "notFound" };
    if (answer.author_id === identity.id) return { error: "forbidden" };

    if (parsed.data.active) {
      const { error } = await client.from("answer_reactions").upsert({
        answer_id: parsed.data.answer_id,
        user_id: identity.id,
      }, { onConflict: "answer_id,user_id", ignoreDuplicates: true });
      if (error) return { error: databaseError(error) };
      return { success: true, active: true };
    }

    const { error } = await client.from("answer_reactions").delete()
      .eq("answer_id", parsed.data.answer_id).eq("user_id", identity.id);
    if (error) return { error: databaseError(error) };
    return { success: true, active: false };
  } catch {
    return { error: "failed" };
  }
}

export async function createAnswerCommentWithClient(client: SupabaseClient, input: unknown): Promise<InteractionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = commentSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { data: answer, error: answerError } = await client.from("answers")
      .select("id").eq("id", parsed.data.answer_id).maybeSingle();
    if (answerError) return { error: "failed" };
    if (!answer) return { error: "notFound" };

    const { data, error } = await client.from("answer_comments").insert({
      answer_id: parsed.data.answer_id,
      author_id: identity.id,
      body: parsed.data.body,
    }).select("id").single();
    if (error || !data?.id) return { error: databaseError(error) };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}

export async function deleteAnswerCommentWithClient(client: SupabaseClient, input: unknown): Promise<InteractionResult> {
  try {
    if (!await getVerifiedIdentity(client)) return { error: "unauthorized" };
    const parsed = deleteCommentSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { data, error } = await client.from("answer_comments").delete()
      .eq("id", parsed.data.comment_id).select("id").maybeSingle();
    if (error) return { error: databaseError(error) };
    if (!data) return { error: "notFound" };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}
