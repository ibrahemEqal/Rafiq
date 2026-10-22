import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { getOwnStudySet, getSharedStudySet, getStudyReviews } from "@/lib/study/data";
import ClientMessages from "@/components/shared/ClientMessages";
import ReviewSession from "./ReviewSession";

export default async function ReviewPage({ id, token }: { id?: string; token?: string }) {
  const client = await createClient();
  const [t, identity] = await Promise.all([getTranslations("Study"), getVerifiedIdentity(client)]);
  if (!token && !identity) notFound();
  const set = token ? await getSharedStudySet(client, token) : await getOwnStudySet(client, id!);
  if (!set) notFound();
  const snapshot = await getStudyReviews(client, set.id, Boolean(identity));
  const base = token ? `/study/shared/${token}` : `/study/${set.id}`;
  return <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 sm:px-6"><div className="mx-auto max-w-3xl"><Link href={base} className="mb-6 inline-block text-sm font-bold text-teal-700">{t("backToSet")}</Link><h1 dir="auto" className="mb-2 break-words text-2xl font-black text-slate-950 sm:text-3xl">{set.title}</h1><p className="mb-7 text-sm leading-7 text-slate-500">{t("reviewSubtitle")}</p><ClientMessages namespace="Study"><ReviewSession cards={set.cards} reviews={snapshot.reviews} signedIn={Boolean(identity)} token={token} now={snapshot.now} /></ClientMessages></div></div>;
}
