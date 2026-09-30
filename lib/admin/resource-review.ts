import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getVerifiedIdentity } from "../auth/identity.ts";
import { isAllowedExternalResourceUrl } from "../validation/resource.ts";

export const resourceStatuses = ["pending", "approved", "rejected", "removed"] as const;
export type ResourceStatus = (typeof resourceStatuses)[number];
export type AdminError = "unauthorized" | "invalid" | "conflict" | "failed" | "previewFailed";

const transitions: Record<ResourceStatus, readonly ResourceStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["removed"],
  rejected: ["pending"],
  removed: ["pending"],
};

const reviewSchema = z.object({
  resourceId: z.guid(),
  expectedStatus: z.enum(resourceStatuses),
  status: z.enum(resourceStatuses),
}).refine((input) => transitions[input.expectedStatus].includes(input.status));

export function parseReviewFilters(input: Record<string, unknown>) {
  const status = z.enum(resourceStatuses).safeParse(input.status);
  const page = typeof input.page === "string" && /^\d{1,6}$/.test(input.page)
    ? Number(input.page)
    : 1;
  return { status: status.success ? status.data : "pending" as const, page: Math.max(1, page) };
}

// Framework-independent server logic so authorization can be regression-tested.
// The Supabase client must be the request's cookie-backed client, never service_role.
export async function getAdminAccess(client: SupabaseClient) {
  const identity = await getVerifiedIdentity(client);
  if (!identity) return { userId: null, isAdmin: false };
  const { data: profile, error: profileError } = await client
    .from("profiles").select("role").eq("id", identity.id).maybeSingle();
  return { userId: identity.id, isAdmin: !profileError && profile?.role === "admin" };
}

export async function moderateResourceWithClient(
  client: SupabaseClient,
  input: unknown,
): Promise<{ success: true } | { error: AdminError }> {
  try {
    if (!(await getAdminAccess(client)).isAdmin) return { error: "unauthorized" };
    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return { error: "invalid" };
    const { resourceId, expectedStatus, status } = parsed.data;
    const { data: updated, error } = await client.from("resources")
      .update({ status })
      .eq("id", resourceId)
      .eq("status", expectedStatus)
      .select("id, status")
      .maybeSingle();
    if (error) return { error: "failed" };
    if (!updated) return { error: "conflict" };
    if (updated.status !== status) return { error: "failed" };
    return { success: true };
  } catch {
    return { error: "failed" };
  }
}

export async function createAdminPreviewWithClient(
  client: SupabaseClient,
  input: unknown,
): Promise<{ url: string } | { error: AdminError }> {
  try {
    if (!(await getAdminAccess(client)).isAdmin) return { error: "unauthorized" };
    const id = z.guid().safeParse(input);
    if (!id.success) return { error: "invalid" };
    const { data: resource, error } = await client.from("resources")
      .select("source_type, storage_path, external_url").eq("id", id.data).maybeSingle();
    if (error || !resource) return { error: "previewFailed" };

    if (resource.source_type === "external") {
      if (!resource.external_url || !isAllowedExternalResourceUrl(resource.external_url)) {
        return { error: "previewFailed" };
      }
      return { url: resource.external_url };
    }

    if (!resource.storage_path) return { error: "previewFailed" };
    const { data, error: signingError } = await client.storage.from("resources")
      .createSignedUrl(resource.storage_path, 60, { download: true });
    if (signingError || !data?.signedUrl) return { error: "previewFailed" };
    return { url: data.signedUrl };
  } catch {
    return { error: "previewFailed" };
  }
}
