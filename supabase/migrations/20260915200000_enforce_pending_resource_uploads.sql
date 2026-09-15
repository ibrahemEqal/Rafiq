begin;

-- Replace both legacy permissive INSERT policies. Changing the UI alone does
-- not prevent direct PostgREST requests from bypassing moderation.
drop policy if exists "Allow authenticated inserts" on public.resources;
drop policy if exists "authenticated users upload resources" on public.resources;

create policy "authenticated users upload resources"
on public.resources for insert to authenticated
with check (
  uploader_id = auth.uid()
  and status = 'pending'::public.resource_status
  and storage_path like (auth.uid()::text || '/%')
);

-- Apply this guard even if another permissive INSERT policy is added later.
create policy "resource inserts require pending owned uploads"
on public.resources as restrictive for insert to public
with check (
  uploader_id = auth.uid()
  and status = 'pending'::public.resource_status
  and storage_path like (auth.uid()::text || '/%')
);

-- Existing resources are untouched. Browser-authenticated admins also insert
-- pending resources; approval remains a separate UPDATE by an admin.
commit;
