import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSharedStudySet } from "@/lib/study/data";
import SetWorkspace from "@/components/study/SetWorkspace";

export default async function SharedStudySetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const set = await getSharedStudySet(await createClient(), token);
  if (!set) notFound();
  return <SetWorkspace set={set} editable={false} token={token} />;
}
