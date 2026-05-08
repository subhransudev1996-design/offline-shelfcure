import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, ownerEmail, contactEmail, contactPhone } = await req.json();

    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (!ownerEmail?.trim()) return NextResponse.json({ error: "Owner email is required" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("desktop_licenses")
      .update({
        owner_email:   ownerEmail.trim(),
        contact_email: contactEmail?.trim() || ownerEmail.trim(),
        contact_phone: contactPhone?.trim() || null,
      })
      .eq("license_key", licenseKey);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
