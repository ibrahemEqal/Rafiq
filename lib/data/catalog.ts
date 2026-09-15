import "server-only";
import { createClient } from "@supabase/supabase-js";

// ONLY public reference names/IDs use a shared cache. No cookies, user tokens,
// roles, resources, book availability or signed download links enter this client.
function createCatalogClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        cache: "force-cache",
        next: { revalidate: 3600, tags: ["public-catalog"] },
      }),
    },
  });
}

export async function getColleges() {
  const { data, error } = await createCatalogClient().from("colleges")
    .select("id, name_ar").order("name_ar");
  if (error) throw new Error("College catalog unavailable");
  return data ?? [];
}

export async function getUploadCatalog() {
  const client = createCatalogClient();
  const [collegeResult, courseResult] = await Promise.all([
    client.from("colleges").select("id, name_ar").order("name_ar"),
    client.from("courses").select("id, name_ar").order("name_ar"),
  ]);
  if (collegeResult.error || courseResult.error) throw new Error("Upload catalog unavailable");
  return { colleges: collegeResult.data ?? [], courses: courseResult.data ?? [] };
}
