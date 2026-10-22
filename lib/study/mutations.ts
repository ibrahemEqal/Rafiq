import type { SupabaseClient } from "@supabase/supabase-js";
import { getVerifiedIdentity } from "../auth/identity.ts";
import { setSchema, updateSetSchema, cardSchema, updateCardSchema, materialSchema, targetSchema, reviewSchema, studyDatabaseError, type StudyResult } from "./validation.ts";
import { z } from "zod";

type Operation = "createSet" | "updateSet" | "deleteSet" | "addCard" | "updateCard" | "deleteCard" | "addMaterial" | "deleteMaterial";

export async function mutateStudyWithClient(client: SupabaseClient, operation: Operation, input: unknown): Promise<StudyResult> {
  try {
    const identity = await getVerifiedIdentity(client);
    if (!identity) return { error: "unauthorized" };
    if (operation === "createSet") {
      const parsed = setSchema.safeParse(input);
      if (!parsed.success) return { error: "invalid" };
      const { data, error } = await client.from("study_sets").insert({ ...parsed.data, owner_id: identity.id }).select("id").single();
      if (error) return { error: studyDatabaseError(error) };
      return data ? { success: true, id: data.id } : { error: "failed" };
    }
    if (operation === "updateSet" || operation === "deleteSet") {
      const parsed = (operation === "updateSet" ? updateSetSchema : z.object({ id: z.guid() })).safeParse(input);
      if (!parsed.success) return { error: "invalid" };
      let query;
      if (operation === "updateSet") {
        const { id, ...fields } = updateSetSchema.parse(parsed.data);
        query = client.from("study_sets").update(fields).eq("id", id);
      } else query = client.from("study_sets").delete().eq("id", parsed.data.id);
      const { data, error } = await query.eq("owner_id", identity.id).select("id").maybeSingle();
      if (error) return { error: studyDatabaseError(error) };
      return data ? { success: true, id: data.id } : { error: "notFound" };
    }
    const schema = operation === "addCard" ? cardSchema : operation === "updateCard" ? updateCardSchema : operation === "addMaterial" ? materialSchema : targetSchema;
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const setId = parsed.data.set_id;
    const owner = await client.from("study_sets").select("id").eq("id", setId).eq("owner_id", identity.id).maybeSingle();
    if (owner.error) return { error: studyDatabaseError(owner.error) };
    if (!owner.data) return { error: "notFound" };
    let query;
    if (operation === "addCard") query = client.from("study_cards").insert(cardSchema.parse(parsed.data));
    else if (operation === "addMaterial") query = client.from("study_materials").insert(materialSchema.parse(parsed.data));
    else if (operation === "updateCard") {
      const { id, set_id, ...fields } = updateCardSchema.parse(parsed.data);
      query = client.from("study_cards").update(fields).eq("id", id).eq("set_id", set_id);
    } else {
      const { id, set_id } = targetSchema.parse(parsed.data);
      query = client.from(operation === "deleteCard" ? "study_cards" : "study_materials").delete().eq("id", id).eq("set_id", set_id);
    }
    const { data, error } = await query.select("id").maybeSingle();
    if (error) return { error: studyDatabaseError(error) };
    return data ? { success: true, id: data.id } : { error: "notFound" };
  } catch { return { error: "failed" }; }
}

export async function reviewCardWithClient(client: SupabaseClient, input: unknown): Promise<StudyResult> {
  try {
    if (!await getVerifiedIdentity(client)) return { error: "unauthorized" };
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { data, error } = await client.rpc("review_study_card", { target_card: parsed.data.card_id, knew: parsed.data.remembered, access_token: parsed.data.token });
    if (error) return { error: studyDatabaseError(error) };
    return data?.card_id ? { success: true, id: data.card_id } : { error: "failed" };
  } catch { return { error: "failed" }; }
}
