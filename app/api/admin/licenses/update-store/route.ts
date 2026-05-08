import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, pharmacyName, ownerName, address, gstNumber, drugLicense } = await req.json();

    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("desktop_licenses")
      .update({
        pharmacy_name: pharmacyName?.trim() || null,
        owner_name:    ownerName?.trim() || null,
        address:       address?.trim() || null,
        gst_number:    gstNumber?.trim() || null,
        drug_license:  drugLicense?.trim() || null,
      })
      .eq("license_key", licenseKey);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
