import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, machineId } = await req.json();
    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const supabase = createServiceClient();

    const { data: lic, error: fetchErr } = await supabase
      .from("desktop_licenses")
      .select("activated_machines")
      .eq("license_key", licenseKey)
      .single();

    if (fetchErr || !lic) return NextResponse.json({ error: "License not found" }, { status: 404 });

    const machines: { machine_id: string; activated_at: string }[] =
      Array.isArray(lic.activated_machines) ? lic.activated_machines : [];

    const updated = machineId
      ? machines.filter((m) => m.machine_id !== machineId) // remove specific machine
      : [];                                                  // clear all

    const { error: updateErr } = await supabase
      .from("desktop_licenses")
      .update({ activated_machines: updated })
      .eq("license_key", licenseKey);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ success: true, remaining: updated.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
