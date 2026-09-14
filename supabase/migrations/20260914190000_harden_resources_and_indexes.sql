begin;

drop policy if exists "Allow authenticated inserts" on public.resources;
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow public downloads" on storage.objects;

update public.resources
set storage_path = regexp_replace(
  storage_path,
  '^.*/storage/v1/object/public/resources/',
  ''
)
where storage_path ~ '^https?://.*/storage/v1/object/public/resources/';

update storage.buckets
set public = false
where id = 'resources';

create policy "users upload resources to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users remove own resource uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "authorized users download resource files"
on storage.objects for select to public
using (
  bucket_id = 'resources'
  and exists (
    select 1
    from public.resources r
    where r.storage_path = name
      and (
        r.status = 'approved'
        or r.uploader_id = auth.uid()
        or public.is_admin(auth.uid())
      )
  )
);

create or replace function public.increment_resource_download(resource_id uuid)
returns void language sql security definer set search_path = public
as $$
  update public.resources
  set download_count = download_count + 1
  where id = resource_id
    and (
      status = 'approved'
      or uploader_id = auth.uid()
      or public.is_admin(auth.uid())
    );
$$;

create or replace function public.increment_resource_view(resource_id uuid)
returns void language sql security definer set search_path = public
as $$
  update public.resources
  set view_count = view_count + 1
  where id = resource_id
    and (
      status = 'approved'
      or uploader_id = auth.uid()
      or public.is_admin(auth.uid())
    );
$$;

revoke all on function public.increment_resource_download(uuid) from public;
revoke all on function public.increment_resource_view(uuid) from public;
grant execute on function public.increment_resource_download(uuid) to anon, authenticated;
grant execute on function public.increment_resource_view(uuid) to anon, authenticated;

create index if not exists idx_books_status_created_at
on public.books (status, created_at desc);

create index if not exists idx_resources_status_type_created_at
on public.resources (status, type, created_at desc);

commit;
