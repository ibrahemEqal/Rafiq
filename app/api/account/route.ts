import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const identity = await getVerifiedIdentity(supabase);

  if (!identity?.email) {
    return NextResponse.json({ account: null }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", identity.id).maybeSingle();
  return NextResponse.json({ account: { email: identity.email, isAdmin: profile?.role === "admin" } }, {
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
