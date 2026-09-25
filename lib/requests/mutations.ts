import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerifiedIdentity } from "../auth/identity.ts";
import {
  mapRequestError,
  requestInputSchema,
  requestStatusInputSchema,
  responseInputSchema,
} from "./validation.ts";

export async function createRequestWithClient(client: SupabaseClient, input: unknown) {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" as const };
    const parsed = requestInputSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" as const };

    const { data, error } = await client.from("requests").insert({
      ...parsed.data,
      requester_id: identity.id,
      status: "open",
    }).select("id").single();
    if (error || !data) return { error: mapRequestError(error?.message ?? "failed") };
    return { success: true as const, id: data.id as string };
  } catch {
    return { error: "failed" as const };
  }
}

export async function createRequestResponseWithClient(client: SupabaseClient, input: unknown) {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" as const };
    const parsed = responseInputSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" as const };

    const { data: request, error: requestError } = await client.from("requests")
      .select("id, status").eq("id", parsed.data.request_id).maybeSingle();
    if (requestError) return { error: "failed" as const };
    if (!request) return { error: "notFound" as const };
    if (request.status !== "open") return { error: "closed" as const };

    const { data, error } = await client.from("request_responses").insert({
      request_id: parsed.data.request_id,
      author_id: identity.id,
      body: parsed.data.body,
      whatsapp_number: parsed.data.whatsapp_number,
    }).select("id").single();
    if (error || !data) return { error: mapRequestError(error?.message ?? "failed") };
    return { success: true as const, id: data.id as string };
  } catch {
    return { error: "failed" as const };
  }
}

export async function updateRequestStatusWithClient(client: SupabaseClient, input: unknown) {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" as const };
    const parsed = requestStatusInputSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" as const };

    const { data, error } = await client.from("requests")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.request_id)
      .eq("requester_id", identity.id)
      .select("id")
      .maybeSingle();
    if (error) return { error: mapRequestError(error.message) };
    if (!data) return { error: "notFound" as const };
    return { success: true as const };
  } catch {
    return { error: "failed" as const };
  }
}
