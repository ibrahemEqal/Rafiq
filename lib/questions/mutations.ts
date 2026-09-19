import type { SupabaseClient } from "@supabase/supabase-js";
import { questionSchema, answerSchema, type QuestionResult } from "./validation.ts";
import { getVerifiedIdentity } from "../auth/identity.ts";

// Only call with the request's cookie-backed client. No service-role bypass.
// User IDs are always derived from verified Auth, never from a supplied payload.
export async function createQuestionWithClient(client: SupabaseClient, input: unknown): Promise<QuestionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = questionSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    if (parsed.data.course_id) {
      const { data: course, error } = await client.from("courses").select("id").eq("id", parsed.data.course_id).maybeSingle();
      if (error) return { error: "failed" };
      if (!course) return { error: "invalid" };
    }
    const { data, error } = await client.from("questions").insert({
      title: parsed.data.title, body: parsed.data.body,
      course_id: parsed.data.course_id, author_id: identity.id,
    }).select("id").single();
    if (error || !data?.id) return { error: "failed" };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}

export async function createAnswerWithClient(client: SupabaseClient, input: unknown): Promise<QuestionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = answerSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { data: question, error: questionError } = await client.from("questions")
      .select("id").eq("id", parsed.data.question_id).maybeSingle();
    if (questionError) return { error: "failed" };
    if (!question) return { error: "notFound" };
    const { data, error } = await client.from("answers").insert({
      question_id: parsed.data.question_id, body: parsed.data.body, author_id: identity.id,
    }).select("id").single();
    if (error || !data?.id) return { error: "failed" };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}
