import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey,
      paymentType,
      baseAmount,
      gstRate,
      firstDueDate,
      notes,
      paymentSource,
      markFirstPaid,
      firstPaidMethod,
      firstPaidReference,
      product = "desktop",
    } = await req.json();

    if (!licenseKey || !paymentType || !baseAmount || !firstDueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const base = Number(baseAmount);
    if (!Number.isFinite(base) || base <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const rate = Number(gstRate ?? 0);
    const amount = Math.round(base + base * rate / 100);

    if (!["one_time", "3_month_emi", "6_month_emi"].includes(paymentType)) {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const validProduct = product === "mobile" ? "mobile" : "desktop";

    // Desktop = one plan per license. Mobile = allow multiple cycles for renewals.
    if (validProduct === "desktop") {
      const { data: existing } = await supabase
        .from("license_payments")
        .select("id")
        .eq("license_key", licenseKey)
        .eq("product", "desktop")
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `A desktop payment plan already exists for this license. Delete it first to create a new one.` },
          { status: 409 },
        );
      }
    }

    // For mobile: compute cycle dates (1-year cycle from first due date)
    let cycleStart: string | null = null;
    let cycleEnd: string | null = null;
    if (validProduct === "mobile") {
      cycleStart = firstDueDate;
      const end = new Date(firstDueDate + "T00:00:00");
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
      cycleEnd = end.toISOString().split("T")[0];
    }

    const { data: payment, error: paymentErr } = await supabase
      .from("license_payments")
      .insert({
        license_key:      licenseKey,
        payment_type:     paymentType,
        base_amount:      base,
        gst_rate:         rate > 0 ? rate : null,
        total_amount:     amount,
        notes:            notes || null,
        payment_source:   paymentSource || "manual_offline",
        product:          validProduct,
        cycle_start_date: cycleStart,
        cycle_end_date:   cycleEnd,
      })
      .select("id")
      .single();

    if (paymentErr || !payment) {
      return NextResponse.json(
        { error: paymentErr?.message || "Failed to create payment" },
        { status: 500 },
      );
    }

    const installmentCount = paymentType === "one_time" ? 1 : paymentType === "3_month_emi" ? 3 : 6;
    const each = Math.round(amount / installmentCount);
    const last = amount - each * (installmentCount - 1); // last absorbs rounding difference

    const installments = Array.from({ length: installmentCount }, (_, i) => {
      const due = new Date(firstDueDate + "T00:00:00");
      due.setMonth(due.getMonth() + i);
      const isFirst = i === 0;
      return {
        payment_id: payment.id,
        license_key: licenseKey,
        installment_number: i + 1,
        amount: i === installmentCount - 1 ? last : each,
        due_date: due.toISOString().split("T")[0],
        paid_date: isFirst && markFirstPaid ? new Date().toISOString().split("T")[0] : null,
        payment_method: isFirst && markFirstPaid ? firstPaidMethod || "cash" : null,
        reference_id: isFirst && markFirstPaid ? firstPaidReference || null : null,
      };
    });

    const { error: instErr } = await supabase.from("license_payment_installments").insert(installments);
    if (instErr) {
      // Roll back the parent row so we don't leave orphans
      await supabase.from("license_payments").delete().eq("id", payment.id);
      return NextResponse.json({ error: instErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error("create-payment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
