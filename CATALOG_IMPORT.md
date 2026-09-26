# An-Najah academic catalog

Rafiq's resource library follows this hierarchy:

`college -> major -> course -> approved resources`

The catalog generator reads the current undergraduate-program list and the
latest Arabic and English study plans published by An-Najah National
University. It produces an idempotent Supabase migration; re-running the
generator updates names and adds new programs/courses without duplicating
existing rows.

```bash
npm run catalog:build
npx supabase db push --dry-run
npx supabase db push
```

Generated migration:

`supabase/migrations/20260926020000_seed_najah_catalog.sql`

Before applying it, confirm the generator summary. At the time this feature was
built, the official catalog returned 13 colleges, 143 programs, and 12,697
program-course records. A course shared by multiple programs is intentionally
stored once under each program because the existing database model makes a
course belong to one major.

Source:

https://www.najah.edu/ar/academic/undergraduate-programs/by-faculty/
