import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateLicenseKey(): string {
  const seg = () =>
    Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
  return `SC-${seg()}-${seg()}-${seg()}-${seg()}`;
}

function calcExpiry(licenseType: string): string | null {
  if (licenseType === "lifetime") return null;
  const d = new Date();
  if (licenseType === "trial") d.setDate(d.getDate() + 7);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  try {
    const {
      lead_id,
      license_type,
      owner_email,
      max_machines,
    } = await req.json();

    if (!lead_id)     return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    if (!owner_email?.trim()) return NextResponse.json({ error: "Owner email required" }, { status: 400 });
    if (!["trial", "yearly", "lifetime"].includes(license_type)) {
      return NextResponse.json({ error: "Invalid license type" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch lead details
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, owner_name, pharmacy_name, phone, email, address, status, converted_license_key")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.converted_license_key) {
      return NextResponse.json({ error: "Lead already converted", licenseKey: lead.converted_license_key }, { status: 409 });
    }

    // Generate unique license key
    let licenseKey = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateLicenseKey();
      const { data: existing } = await supabase
        .from("desktop_licenses")
        .select("license_key")
        .eq("license_key", candidate)
        .maybeSingle();
      if (!existing) { licenseKey = candidate; break; }
    }
    if (!licenseKey) {
      return NextResponse.json({ error: "Could not generate unique license key" }, { status: 500 });
    }

    const resolvedEmail = owner_email.trim();

    // Create license
    const { error: licErr } = await supabase.from("desktop_licenses").insert({
      license_key:        licenseKey,
      pharmacy_name:      lead.pharmacy_name?.trim() || lead.owner_name,
      license_type,
      status:             "active",
      expiry_date:        calcExpiry(license_type),
      plan:               "Standard",
      max_machines:       Number(max_machines) || 1,
      owner_email:        resolvedEmail,
      contact_email:      resolvedEmail,
      contact_phone:      lead.phone || null,
      address:            lead.address || null,
      owner_name:         lead.owner_name,
      activated_machines: [],
      ai_credits:         0,
    });

    if (licErr) return NextResponse.json({ error: licErr.message }, { status: 500 });

    // Mark lead as converted
    const { error: updateErr } = await supabase
      .from("leads")
      .update({
        status:               "converted",
        converted_license_key: licenseKey,
        updated_at:           new Date().toISOString(),
      })
      .eq("id", lead_id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ success: true, licenseKey });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
