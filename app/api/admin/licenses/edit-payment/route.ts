import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, paymentType, baseAmount, gstRate, notes } = await req.json();

    if (!paymentId) return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });

    const base = Number(baseAmount);
    if (!Number.isFinite(base) || base <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const rate   = Number(gstRate ?? 0);
    const amount = Math.round(base + base * rate / 100);

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("license_payments")
      .update({
        payment_type: paymentType,
        base_amount:  base,
        gst_rate:     rate > 0 ? rate : null,
        total_amount: amount,
        notes:        notes || null,
      })
      .eq("id", paymentId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
