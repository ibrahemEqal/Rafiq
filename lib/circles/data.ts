import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  parseCircleList,
  circleError,
  type CampusCircle,
  type CircleError,
} from "./model";
export async function loadCircles(
  client: SupabaseClient,
  mine = false,
  target: string | null = null,
): Promise<
  | { circles: CampusCircle[]; error?: never }
  | { error: CircleError; circles?: never }
> {
  if (target !== null && !z.guid().safeParse(target).success)
    return { error: "invalid" };
  const { data, error } = await client.rpc("list_campus_circles", {
    only_mine: mine,
    target_circle: target,
  });
  if (error) return { error: circleError(error) };
  const parsed = parseCircleList(data);
  return parsed ? { circles: parsed } : { error: "failed" as const };
}
