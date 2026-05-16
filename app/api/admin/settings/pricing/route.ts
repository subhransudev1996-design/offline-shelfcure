import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const DEFAULTS = {
  desktop_base_amount: 0,
  desktop_gst_rate: 18,
  desktop_gst_inclusive: false,
  desktop_default_payment_type: "one_time" as const,
  mobile_base_amount: 0,
  mobile_gst_rate: 18,
  mobile_gst_inclusive: false,
  ai_credits_included: 50,
  label_scans_included: 50,
};

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, settings: DEFAULTS }, { status: 500 });
  }
  return NextResponse.json({ settings: data ?? DEFAULTS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validTypes = ["one_time", "3_month_emi", "6_month_emi"];

    const payload = {
      id: 1,
      desktop_base_amount: Number(body.desktop_base_amount) || 0,
      desktop_gst_rate: Number(body.desktop_gst_rate) || 0,
      desktop_gst_inclusive: !!body.desktop_gst_inclusive,
      desktop_default_payment_type: validTypes.includes(body.desktop_default_payment_type)
        ? body.desktop_default_payment_type
        : "one_time",
      mobile_base_amount: Number(body.mobile_base_amount) || 0,
      mobile_gst_rate: Number(body.mobile_gst_rate) || 0,
      mobile_gst_inclusive: !!body.mobile_gst_inclusive,
      ai_credits_included: Math.max(0, Math.round(Number(body.ai_credits_included) || 0)),
      label_scans_included: Math.max(0, Math.round(Number(body.label_scans_included) || 0)),
      updated_at: new Date().toISOString(),
    };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("pricing_settings")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, settings: payload });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
