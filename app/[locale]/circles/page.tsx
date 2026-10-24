import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { loadCircles } from "@/lib/circles/data";
import ClientMessages from "@/components/shared/ClientMessages";
import CircleBoard from "@/components/circles/CircleBoard";
async function requestClock() {
  return Date.now();
}
export default async function CirclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const client = await createClient();
  const [identity, params, now] = await Promise.all([
    getVerifiedIdentity(client),
    searchParams,
    requestClock(),
  ]);
  if (params.circle && !z.guid().safeParse(params.circle).success) notFound();
  const target = typeof params.circle === "string" ? params.circle : null;
  const result = await loadCircles(client, false, target);
  if (result.error && result.error !== "unavailable")
    throw Error("Campus circles unavailable");
  return (
    <ClientMessages namespace="Circles">
      <CircleBoard
        key={identity?.id ?? "guest"}
        initial={result.circles ? result.circles : []}
        signedIn={Boolean(identity)}
        initialNow={now}
        unavailable={Boolean(result.error)}
        initialTarget={target}
      />
    </ClientMessages>
  );
}
