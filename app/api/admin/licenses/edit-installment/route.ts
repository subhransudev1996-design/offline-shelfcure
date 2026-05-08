import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { installmentId, amount, dueDate, paidDate, paymentMethod, referenceId, notes } =
      await req.json();

    if (!installmentId) return NextResponse.json({ error: "Missing installmentId" }, { status: 400 });

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("license_payment_installments")
      .update({
        amount: amt,
        due_date: dueDate,
        paid_date: paidDate || null,
        payment_method: paidDate ? paymentMethod || null : null,
        reference_id: paidDate ? referenceId || null : null,
        notes: notes || null,
      })
      .eq("id", installmentId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
