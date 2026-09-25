import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import ForumPostActions from "./ForumPostActions";

export default async function QuestionActions({ questionId, authorId }: { questionId: string; authorId: string }) {
  const client = await createClient();
  const identity = await getVerifiedIdentity(client);
  if (!identity) return null;
  const { data: profile } = await client.from("profiles").select("role").eq("id", identity.id).maybeSingle();
  const isAdmin = profile?.role === "admin";
  return <ForumPostActions target={{ target_type: "question", target_id: questionId }} questionId={questionId}
    canManage={identity.id === authorId || isAdmin}
    canReport={identity.id !== authorId && !isAdmin} />;
}
