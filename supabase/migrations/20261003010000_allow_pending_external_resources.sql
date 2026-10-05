begin;

-- External links have no Storage path. Keep ownership and moderation mandatory
-- for both sources, including when another permissive policy grants INSERT.
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

-- resources_source_location_check validates the Google host and source metadata.
commit;
