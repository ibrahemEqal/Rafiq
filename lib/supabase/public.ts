import "server-only";
import { createClient } from "@supabase/supabase-js";

export const publicDataTags = {
  resources: "public-resources",
  books: "public-books",
  questions: "public-questions",
} as const;

function tagFor(input: RequestInfo | URL) {
  const raw = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
  try {
    const table = new URL(raw).pathname.match(/\/rest\/v1\/([^/]+)/)?.[1];
    return table && table in publicDataTags
      ? [publicDataTags[table as keyof typeof publicDataTags]]
      : ["public-data"];
  } catch {
    return ["public-data"];
  }
}

// Anonymous, read-only queries are safe to share between users. A short SWR
// window removes Supabase latency from hot public routes, while Server Actions
// invalidate the table tag immediately after visible mutations.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          cache: "force-cache",
          next: { revalidate: 60, tags: tagFor(input) },
        }),
      },
    },
  );
}
