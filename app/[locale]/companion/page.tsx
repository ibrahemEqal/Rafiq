import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { loadCompanion } from "@/lib/companion/data";
import { emptySnapshot } from "@/lib/companion/model";
import ClientMessages from "@/components/shared/ClientMessages";
import CompanionApp from "@/components/companion/CompanionApp";
async function requestClock() {
  return Date.now();
}
export default async function CompanionPage({
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
  const result = identity ? await loadCompanion(client, identity.id) : null;
  if (result && result.error && result.error !== "unavailable")
    throw Error("Companion data unavailable");
  const snapshot =
    result && result.snapshot ? result.snapshot : emptySnapshot();
  return (
    <ClientMessages namespace="Companion">
      <CompanionApp
        key={`${identity?.id ?? "guest"}:${result?.snapshot ? "cloud" : "device"}`}
        initial={snapshot}
        mode={result && result.snapshot ? "cloud" : "device"}
        userId={identity?.id ?? null}
        initialNow={now}
        initialTab={typeof params.tab === "string" ? params.tab : "day"}
        initialMoment={typeof params.moment === "string" ? params.moment : ""}
      />
    </ClientMessages>
  );
}
