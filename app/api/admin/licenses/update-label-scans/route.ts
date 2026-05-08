import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, labelScansUsed } = await req.json();
    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (typeof labelScansUsed !== "number" || !Number.isInteger(labelScansUsed) || labelScansUsed < 0) {
      return NextResponse.json({ error: "labelScansUsed must be a non-negative integer" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("desktop_licenses")
      .update({ label_scans_used: labelScansUsed })
      .eq("license_key", licenseKey);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
