"use server";
import { createClient } from "@/lib/supabase/server";
import { mutateCircleWithClient } from "@/lib/circles/mutations";
import { loadCircles } from "@/lib/circles/data";
export async function mutateCircle(operation: unknown, input: unknown) {
  return mutateCircleWithClient(await createClient(), operation, input);
}
export async function refreshCircles(
  mine: boolean,
  target: string | null = null,
) {
  return loadCircles(await createClient(), mine === true, target);
}
