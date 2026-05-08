import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, targetPlan } = await req.json();

    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (targetPlan !== "yearly" && targetPlan !== "lifetime") {
      return NextResponse.json({ error: "targetPlan must be 'yearly' or 'lifetime'" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const expiryDate =
      targetPlan === "yearly"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null;

    const { error } = await supabase
      .from("desktop_licenses")
      .update({
        license_type: targetPlan,
        expiry_date:  expiryDate,
        updated_at:   new Date().toISOString(),
      })
      .eq("license_key", licenseKey);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, targetPlan, expiryDate });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
