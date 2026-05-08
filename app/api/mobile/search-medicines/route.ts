import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const licenseKey = searchParams.get("licenseKey")?.trim();
    const q          = searchParams.get("q")?.trim();

    if (!licenseKey)
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const supabase = createServiceClient();

    let query = supabase
      .from("pharmacy_medicine_cache")
      .select("medicine_id, name, generic_name, manufacturer, barcode, gst_rate")
      .eq("license_key", licenseKey)
      .order("name")
      .limit(30);

    if (q && q.length > 0) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ medicines: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
