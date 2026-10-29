import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getAdminAccess } from './resource-review.ts';
import { contentEntities, isContentEntity, type AdminField, type ContentEntity, type ContentError, type ContentPage } from './content-model.ts';
import { isAllowedExternalResourceUrl } from '../validation/resource.ts';

const inputSchema = z.object({ entity: z.string().refine(isContentEntity), id: z.guid(), version: z.string().regex(/^[a-f0-9]{32}$/), operation: z.enum(['update','delete']), patch: z.record(z.string(),z.union([z.string(),z.null()])).default({}) }).strict();
export function contentError(error: { code?: string; message?: string }): ContentError {
  if (error.code === '42501') return 'unauthorized';
  if (error.code === 'PGRST202' || error.code === '42883' || error.message?.includes('schema cache')) return 'migration';
  if (error.code === '40001') return 'conflict';
  if (error.code === '23503') return 'dependencies';
  if (/cannot_change_own_access|last_admin/.test(error.message ?? '')) return 'ownAccess';
  if (error.code?.startsWith('22') || error.code?.startsWith('23')) return 'invalid';
  return 'failed';
}
export function parseContentMutation(input: unknown) {
  const result = inputSchema.safeParse(input);
  if (!result.success) return null;
  const value = result.data;
  if (!isContentEntity(value.entity)) return null;
  if (value.operation === 'delete') return Object.keys(value.patch).length ? null : value;
  const fields: AdminField[] = contentEntities[value.entity].fields;
  if (!Object.keys(value.patch).length) return null;
  for (const [key, entry] of Object.entries(value.patch)) {
    const field = fields.find(f => f.key === key);
    if (!field) return null;
    if (entry === null) { if (!field.nullable) return null; continue; }
    const text = entry.trim();
    if (text.length < (field.min ?? 0) || text.length > (field.max ?? 8000)) return null;
    if (field.kind === 'course' && !z.guid().safeParse(text).success) return null;
    if (field.options && !field.options.includes(text)) return null;
    if (key === 'external_url' && text && !isAllowedExternalResourceUrl(text)) return null;
    if (key === 'url' && !/^https:\/\/(drive\.google\.com|docs\.google\.com|www\.youtube\.com|masaaq\.net)\//.test(text)) return null;
    if (key === 'username' && !/^[a-zA-Z0-9_]{3,30}$/.test(text)) return null;
    if (key === 'whatsapp_number' && text && !/^\+?[\d\s()-]{8,20}$/.test(text)) return null;
    value.patch[key] = field.nullable && !text ? null : text;
  }
  return value;
}
export async function listContentWithClient(client: SupabaseClient, entity: ContentEntity, query = '', page = 1): Promise<ContentPage | {error: ContentError}> {
  try {
    if (!(await getAdminAccess(client)).isAdmin) return { error:'unauthorized' };
    if (!isContentEntity(entity) || query.length > 100 || !Number.isSafeInteger(page) || page < 1 || page > 100000) return {error:'invalid'};
    const {data,error} = await client.rpc('admin_content_list',{entity,query,page_number:page});
    if (error) return {error:contentError(error)};
    if (!data || !Array.isArray(data.rows) || !Number.isSafeInteger(data.total) || data.total < 0) return {error:'failed'};
    return data as ContentPage;
  } catch { return {error:'failed'}; }
}
export async function mutateContentWithClient(client: SupabaseClient,input: unknown): Promise<{success:true}|{error:ContentError}> {
  try {
    if (!(await getAdminAccess(client)).isAdmin) return {error:'unauthorized'};
    const parsed = parseContentMutation(input);
    if (!parsed) return {error:'invalid'};
    const {data,error} = await client.rpc('admin_content_mutate',{entity:parsed.entity,target_id:parsed.id,expected_version:parsed.version,operation:parsed.operation,patch:parsed.patch});
    if (error) return {error:contentError(error)};
    return data?.success === true ? {success:true} : {error:'failed'};
  } catch { return {error:'failed'}; }
}
export async function approveAllWithClient(client: SupabaseClient): Promise<{success:true;count:number}|{error:ContentError}> {
  try {
    if (!(await getAdminAccess(client)).isAdmin) return {error:'unauthorized'};
    const {data,error} = await client.rpc('admin_approve_pending_resources');
    if (error) return {error:contentError(error)};
    return Number.isSafeInteger(data) && data >= 0 ? {success:true,count:data} : {error:'failed'};
  } catch { return {error:'failed'}; }
}
