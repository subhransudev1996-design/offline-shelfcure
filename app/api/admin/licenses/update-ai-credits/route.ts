import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, aiCredits } = await req.json();
    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const credits = Number(aiCredits);
    if (isNaN(credits) || credits < 0) {
      return NextResponse.json({ error: "AI credits must be a non-negative number" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // ai_credits_total = the contracted/purchased amount (shown on invoice)
    // ai_credits       = remaining balance (decremented by the desktop app)
    // Setting both to the same value allocates a fresh package of credits.
    const { error } = await supabase
      .from("desktop_licenses")
      .update({ ai_credits: credits, ai_credits_total: credits })
      .eq("license_key", licenseKey);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, ai_credits: credits, ai_credits_total: credits });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
