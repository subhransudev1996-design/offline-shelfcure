import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `SC-${seg()}-${seg()}-${seg()}-${seg()}`;
}

function calcExpiry(licenseType: string): string | null {
  if (licenseType === "lifetime") return null;
  const d = new Date();
  if (licenseType === "trial") d.setDate(d.getDate() + 7);
  else d.setFullYear(d.getFullYear() + 1); // yearly
  return d.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  try {
    const {
      pharmacyName,
      licenseType,
      ownerEmail,
      contactEmail,
      contactPhone,
      address,
      plan,
      maxMachines,
    } = await req.json();

    if (!pharmacyName?.trim()) {
      return NextResponse.json({ error: "Pharmacy name is required" }, { status: 400 });
    }
    if (!["trial", "yearly", "lifetime"].includes(licenseType)) {
      return NextResponse.json({ error: "Invalid license type" }, { status: 400 });
    }
    if (!ownerEmail?.trim()) {
      return NextResponse.json({ error: "Owner email is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Generate a unique license key (retry up to 5 times on collision)
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
      return NextResponse.json({ error: "Could not generate unique license key, try again" }, { status: 500 });
    }

    const resolvedContactEmail = contactEmail?.trim() || ownerEmail.trim();

    const { error } = await supabase.from("desktop_licenses").insert({
      license_key:    licenseKey,
      pharmacy_name:  pharmacyName.trim(),
      license_type:   licenseType,
      status:         "active",
      expiry_date:    calcExpiry(licenseType),
      plan:           plan?.trim() || "Standard",
      max_machines:   Number(maxMachines) || 1,
      owner_email:    ownerEmail.trim(),
      contact_email:  resolvedContactEmail,
      contact_phone:  contactPhone?.trim() || null,
      address:        address?.trim() || null,
      activated_machines: [],
      ai_credits:     0,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, licenseKey });
  } catch (err) {
    console.error("create-license error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
