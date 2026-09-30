-- Allow a resource to live either in Supabase Storage or as a vetted Google Drive/Docs link.
-- Existing rows remain upload-backed.

alter table public.resources
  add column if not exists source_type text not null default 'upload',
  add column if not exists external_url text;

alter table public.resources
  alter column storage_path drop not null,
  alter column file_size drop not null,
  alter column mime_type drop not null;

alter table public.resources
  drop constraint if exists resources_source_type_check,
  add constraint resources_source_type_check
    check (source_type in ('upload', 'external'));

alter table public.resources
  drop constraint if exists resources_source_location_check,
  add constraint resources_source_location_check
    check (
      (
        source_type = 'upload'
        and storage_path is not null
        and file_size is not null
        and file_size > 0
        and mime_type is not null
        and external_url is null
      )
      or
      (
        source_type = 'external'
        and storage_path is null
        and file_size is null
        and mime_type is null
        and external_url is not null
        and external_url ~* '^https://(drive|docs)\.google\.com/'
      )
    );

-- Administrators need complete visibility over the book exchange, including taken listings.
drop policy if exists "admins manage all books" on public.books;
create policy "admins manage all books"
on public.books
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Let administrators maintain user profile metadata/roles from future dashboard controls
-- without weakening the existing self-update policy for students.
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
