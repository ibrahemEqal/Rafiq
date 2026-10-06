"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccess } from "@/lib/admin/resource-review";
import { publicDataTags } from "@/lib/supabase/public";

const inputSchema = z.object({
  kind: z.enum(["book", "request", "question", "answer", "comment"]),
  id: z.guid(),
});
const tables = { book: "books", request: "requests", question: "questions", answer: "answers", comment: "answer_comments" } as const;

export async function deleteAnyContent(input: unknown) {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" as const };
  const client = await createClient();
  if (!(await getAdminAccess(client)).isAdmin) return { error: "unauthorized" as const };
  const { error } = await client.from(tables[parsed.data.kind]).delete().eq("id", parsed.data.id);
  if (error) return { error: "failed" as const };
  const paths = { book: "/[locale]/books", request: "/[locale]/requests", question: "/[locale]/questions", answer: "/[locale]/questions", comment: "/[locale]/questions" };
  revalidatePath(paths[parsed.data.kind], "page");
  revalidateTag(publicDataTags.questions, "max");
  revalidateTag(publicDataTags.requests, "max");
  return { success: true as const };
}
