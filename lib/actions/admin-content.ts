'use server';
import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { publicDataTags } from '@/lib/supabase/public';
import { approveAllWithClient, mutateContentWithClient, listContentWithClient } from '@/lib/admin/content-management';
function invalidate() {
  revalidatePath('/[locale]', 'layout');
  updateTag('public-data');
  for (const tag of Object.values(publicDataTags)) updateTag(tag);
}
export async function approveAllPendingResources() {
  const result = await approveAllWithClient(await createClient());
  if ('success' in result) invalidate();
  return result;
}
export async function mutateAdminContent(input: unknown) {
  const result = await mutateContentWithClient(await createClient(), input);
  if ('success' in result) invalidate();
  return result;
}

export async function findAdminCourses(query: string) {
  if (typeof query !== 'string' || query.length > 100) return { error: 'invalid' as const };
  return listContentWithClient(await createClient(), 'courses', query, 1);
}
