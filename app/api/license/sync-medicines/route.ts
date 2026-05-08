import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface MedicineRow {
  medicine_id:  number;
  name:         string;
  generic_name: string | null;
  manufacturer: string | null;
  barcode:      string | null;
  gst_rate:     number | null;
}

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, medicines } = await req.json() as {
      licenseKey: string;
      medicines:  MedicineRow[];
    };

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (!Array.isArray(medicines) || medicines.length === 0)
      return NextResponse.json({ success: true, synced: 0 });

    const supabase = createServiceClient();

    // Upsert in batches of 500 to stay within payload limits
    const BATCH = 500;
    let synced = 0;
    for (let i = 0; i < medicines.length; i += BATCH) {
      const chunk = medicines.slice(i, i + BATCH).map((m) => ({
        license_key:  licenseKey.trim(),
        medicine_id:  m.medicine_id,
        name:         m.name,
        generic_name: m.generic_name ?? null,
        manufacturer: m.manufacturer ?? null,
        barcode:      m.barcode      ?? null,
        gst_rate:     m.gst_rate     ?? null,
        updated_at:   new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("pharmacy_medicine_cache")
        .upsert(chunk, { onConflict: "license_key,medicine_id" });

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      synced += chunk.length;
    }

    return NextResponse.json({ success: true, synced });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
