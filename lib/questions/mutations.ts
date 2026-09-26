import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerifiedIdentity } from "../auth/identity.ts";
import {
  questionSchema, answerSchema, updateQuestionSchema, updateAnswerSchema,
  forumTargetSchema, reportSchema, type QuestionError, type QuestionResult,
} from "./validation.ts";

function databaseError(error: unknown): QuestionError {
  if (!error || typeof error !== "object") return "failed";
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  if (message.includes("forum_rate_limited")) return "rateLimited";
  if (message.includes("duplicate_pending_report")) return "duplicate";
  if (message.includes("self_report_forbidden") || message.includes("author_mismatch")) return "forbidden";
  if (message.includes("report_target_missing")) return "notFound";
  return "failed";
}

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
    if (error) return { error: databaseError(error) };
    if (!data?.id) return { error: "failed" };
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
    if (error) return { error: databaseError(error) };
    if (!data?.id) return { error: "failed" };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}

export async function updateQuestionWithClient(client: SupabaseClient, input: unknown): Promise<QuestionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = updateQuestionSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    if (parsed.data.course_id) {
      const { data: course, error } = await client.from("courses").select("id").eq("id", parsed.data.course_id).maybeSingle();
      if (error) return { error: "failed" };
      if (!course) return { error: "invalid" };
    }
    const { data, error } = await client.from("questions").update({
      title: parsed.data.title, body: parsed.data.body, course_id: parsed.data.course_id,
    }).eq("id", parsed.data.question_id).select("id").maybeSingle();
    if (error) return { error: databaseError(error) };
    if (!data) return { error: "notFound" };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}

export async function updateAnswerWithClient(client: SupabaseClient, input: unknown): Promise<QuestionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = updateAnswerSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { data, error } = await client.from("answers").update({ body: parsed.data.body })
      .eq("id", parsed.data.answer_id).select("id, question_id").maybeSingle();
    if (error) return { error: databaseError(error) };
    if (!data) return { error: "notFound" };
    return { success: true, id: data.id, questionId: data.question_id };
  } catch {
    return { error: "failed" };
  }
}

export async function deleteForumPostWithClient(client: SupabaseClient, input: unknown): Promise<QuestionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = forumTargetSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    if (parsed.data.target_type === "question") {
      const { data, error } = await client.from("questions").delete().eq("id", parsed.data.target_id).select("id").maybeSingle();
      if (error) return { error: databaseError(error) };
      if (!data) return { error: "notFound" };
      return { success: true, id: data.id };
    }
    const { data, error } = await client.from("answers").delete().eq("id", parsed.data.target_id).select("id, question_id").maybeSingle();
    if (error) return { error: databaseError(error) };
    if (!data) return { error: "notFound" };
    return { success: true, id: data.id, questionId: data.question_id };
  } catch {
    return { error: "failed" };
  }
}

export async function createReportWithClient(client: SupabaseClient, input: unknown): Promise<QuestionResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    const parsed = reportSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const table = parsed.data.target_type === "question" ? "questions" : "answers";
    const { data: target, error: targetError } = await client.from(table)
      .select("id, author_id").eq("id", parsed.data.target_id).maybeSingle();
    if (targetError) return { error: "failed" };
    if (!target) return { error: "notFound" };
    if (target.author_id === identity.id) return { error: "forbidden" };
    const { data, error } = await client.from("reports").insert({
      reporter_id: identity.id, target_type: parsed.data.target_type,
      target_id: parsed.data.target_id, reason: parsed.data.reason,
    }).select("id").single();
    if (error) return { error: databaseError(error) };
    if (!data?.id) return { error: "failed" };
    return { success: true, id: data.id };
  } catch {
    return { error: "failed" };
  }
}
