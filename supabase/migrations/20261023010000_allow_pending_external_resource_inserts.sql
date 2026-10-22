begin;

-- Keep moderation and uploader ownership mandatory for BOTH source types.
-- The existing resources_source_location_check validates the allowed external
-- host and the mutually exclusive location fields, even for direct REST writes.
drop policy if exists "authenticated users upload resources" on public.resources;
drop policy if exists "resource inserts require pending owned uploads" on public.resources;

create policy "authenticated users upload resources"
on public.resources for insert to authenticated
with check (
  uploader_id = auth.uid()
  and status = 'pending'::public.resource_status
  and (
    (source_type = 'upload' and storage_path like (auth.uid()::text || '/%'))
    or (source_type = 'external' and storage_path is null)
  )
);

-- A restrictive policy prevents future permissive policies from bypassing this
-- guard. Anonymous inserts still fail because auth.uid() is NULL.
create policy "resource inserts require pending owned uploads"
on public.resources as restrictive for insert to public
with check (
  uploader_id = auth.uid()
  and status = 'pending'::public.resource_status
  and (
    (source_type = 'upload' and storage_path like (auth.uid()::text || '/%'))
    or (source_type = 'external' and storage_path is null)
  )
);

commit;
