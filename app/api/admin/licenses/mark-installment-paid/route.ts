import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { installmentId, paidDate, paymentMethod, referenceId, notes } = await req.json();

    if (!installmentId) {
      return NextResponse.json({ error: "Missing installmentId" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("license_payment_installments")
      .update({
        paid_date: paidDate || new Date().toISOString().split("T")[0],
        payment_method: paymentMethod || null,
        reference_id: referenceId || null,
        notes: notes || null,
      })
      .eq("id", installmentId);

    if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
