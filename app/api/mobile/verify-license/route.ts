import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const supabase = createServiceClient();

    const { data: lic, error } = await supabase
      .from("desktop_licenses")
      .select("license_key, pharmacy_name, status, label_scans_used")
      .eq("license_key", licenseKey.trim())
      .single();

    if (error || !lic)
      return NextResponse.json({ error: "Invalid license key" }, { status: 404 });

    if (lic.status !== "active")
      return NextResponse.json({ error: "License is not active" }, { status: 403 });

    return NextResponse.json({
      success:       true,
      pharmacyName:  lic.pharmacy_name,
      scansRemaining: lic.label_scans_used ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
