import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { studyDatabaseError, type StudySet, type StudyReview } from "./validation";

const content = z.object({
  id: z.guid(), title: z.string(), subject: z.string(), description: z.string(), visibility: z.literal("shared"),
  cards: z.array(z.object({ id: z.guid(), front: z.string(), back: z.string() })).max(300),
  materials: z.array(z.object({ id: z.guid(), title: z.string(), url: z.string() })).max(100),
});

export async function getOwnStudySet(client: SupabaseClient, id: string): Promise<StudySet | null> {
  if (!z.guid().safeParse(id).success) return null;
  const { data: set, error } = await client.from("study_sets").select("id,title,subject,description,visibility,share_token").eq("id", id).maybeSingle();
  if (error) throw new Error("Study set unavailable");
  if (!set) return null;
  const [cards, materials] = await Promise.all([
    client.from("study_cards").select("id,front,back").eq("set_id", id).order("created_at").order("id").limit(300),
    client.from("study_materials").select("id,title,url").eq("set_id", id).order("created_at").order("id").limit(100),
  ]);
  if (cards.error || materials.error) throw new Error("Study content unavailable");
  return { ...set, cards: cards.data ?? [], materials: materials.data ?? [] } as StudySet;
}

export async function getSharedStudySet(client: SupabaseClient, token: string): Promise<StudySet | null> {
  if (!z.guid().safeParse(token).success) return null;
  const { data, error } = await client.rpc("get_shared_study_set", { token });
  if (error) throw new Error("Shared study content unavailable");
  if (!data) return null;
  const parsed = content.safeParse(data);
  if (!parsed.success) throw new Error("Invalid study content");
  return parsed.data;
}

export async function getStudyReviews(client: SupabaseClient, setId: string, signedIn: boolean): Promise<{ reviews: StudyReview[]; now: number }> {
  if (!signedIn) return { reviews: [], now: Date.now() };
  const { data, error } = await client.from("study_card_reviews").select("card_id,remembered,next_review_at").eq("set_id", setId).limit(300);
  if (error) throw new Error("Study progress unavailable");
  return { reviews: data ?? [], now: Date.now() };
}

export async function getStudySets(client: SupabaseClient, ownerId: string, page: number) {
  const { data, error } = await client.from("study_sets")
    .select("id,title,subject,description,visibility,updated_at,study_cards(count),study_materials(count)")
    .eq("owner_id", ownerId).order("updated_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20);
  if (error && studyDatabaseError(error) === "unavailable") return { sets: [], more: false, unavailable: true };
  if (error) throw new Error("Study sets unavailable");
  return { sets: (data ?? []).slice(0, 20), more: (data?.length ?? 0) > 20, unavailable: false };
}
