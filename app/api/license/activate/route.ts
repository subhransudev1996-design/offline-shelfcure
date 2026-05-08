import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Called by the desktop app instead of writing directly to Supabase with the anon key.
// Uses the service role key server-side so the anon key never needs write access.
export async function POST(req: NextRequest) {
  try {
    const { license_key, machine_id } = await req.json();

    if (!license_key?.trim() || !machine_id?.trim()) {
      return NextResponse.json({ error: "Missing license_key or machine_id" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: lic, error: fetchErr } = await supabase
      .from("desktop_licenses")
      .select("license_key, pharmacy_name, plan, status, expiry_date, max_machines, activated_machines, ai_credits")
      .eq("license_key", license_key.trim())
      .single();

    if (fetchErr || !lic) {
      return NextResponse.json({ error: "Invalid license key. Please check and try again." }, { status: 404 });
    }

    if (lic.status !== "active") {
      return NextResponse.json({ error: `License is ${lic.status}. Please contact ShelfCure support.` }, { status: 403 });
    }

    // Check expiry
    if (lic.expiry_date) {
      const expiry = new Date(lic.expiry_date + "T23:59:59");
      if (expiry < new Date()) {
        return NextResponse.json({ error: "License has expired. Please renew to continue." }, { status: 403 });
      }
    }

    const machines: { machine_id: string; activated_at: string }[] =
      Array.isArray(lic.activated_machines) ? lic.activated_machines : [];

    const alreadyActivated = machines.some((m) => m.machine_id === machine_id);

    if (!alreadyActivated) {
      if (machines.length >= (lic.max_machines ?? 1)) {
        return NextResponse.json({
          error: `This license is already activated on ${machines.length} machine(s). Maximum allowed: ${lic.max_machines}. Contact support to add more machines.`,
        }, { status: 403 });
      }

      machines.push({ machine_id, activated_at: new Date().toISOString() });

      const { error: updateErr } = await supabase
        .from("desktop_licenses")
        .update({ activated_machines: machines, updated_at: new Date().toISOString() })
        .eq("license_key", license_key.trim());

      if (updateErr) {
        return NextResponse.json({ error: "Activation failed. Please try again." }, { status: 500 });
      }
    }

    // Calculate days until expiry
    const days_until_expiry = lic.expiry_date
      ? Math.ceil((new Date(lic.expiry_date + "T23:59:59").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return NextResponse.json({
      success: true,
      license_key:        lic.license_key,
      pharmacy_name:      lic.pharmacy_name,
      plan:               lic.plan,
      expiry_date:        lic.expiry_date ?? null,
      status:             "active",
      is_active:          true,
      days_until_expiry,
      ai_credits:         lic.ai_credits ?? 0,
    });
  } catch (err) {
    console.error("activate error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
