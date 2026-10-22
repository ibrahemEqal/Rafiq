import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { getOwnStudySet } from "@/lib/study/data";
import SetWorkspace from "@/components/study/SetWorkspace";

export default async function StudySetPage({ params }: { params: Promise<{ id: string }> }) {
  const client = await createClient();
  if (!await getVerifiedIdentity(client)) notFound();
  const set = await getOwnStudySet(client, (await params).id);
  if (!set) notFound();
  return <SetWorkspace set={set} editable />;
}
