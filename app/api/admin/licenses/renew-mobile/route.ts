import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Adds 1 year to a YYYY-MM-DD date string (returns YYYY-MM-DD)
function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const today = () => new Date().toISOString().split("T")[0];

export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey,
      baseAmount,         // optional override
      gstRate,            // optional override
      applyGst = true,
      markPaid = false,
      paidMethod,
      paidReference,
      notes,
    } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ error: "licenseKey is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Look up license + global pricing in parallel
    const [{ data: lic }, { data: pricing }, { data: lastCycle }] = await Promise.all([
      supabase
        .from("desktop_licenses")
        .select("license_key, mobile_addon, mobile_addon_expiry")
        .eq("license_key", licenseKey)
        .single(),
      supabase
        .from("pricing_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("license_payments")
        .select("cycle_end_date")
        .eq("license_key", licenseKey)
        .eq("product", "mobile")
        .order("cycle_end_date", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!lic) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // 2. Resolve renewal price
    const inclusive = !!pricing?.mobile_gst_inclusive;
    const globalGst = Number(pricing?.mobile_gst_rate ?? 18);
    const globalAmt = Number(pricing?.mobile_base_amount ?? 0);
    const resolvedGlobalBase = inclusive && globalAmt > 0
      ? globalAmt / (1 + globalGst / 100)
      : globalAmt;

    const base = baseAmount != null ? Number(baseAmount) : resolvedGlobalBase;
    if (!Number.isFinite(base) || base <= 0) {
      return NextResponse.json({ error: "No mobile price configured. Set it in /admin/settings/pricing or pass baseAmount." }, { status: 400 });
    }

    const rate = applyGst ? Number(gstRate ?? globalGst) : 0;
    const totalAmount = Math.round(base + base * rate / 100);

    // 3. Compute new cycle dates
    //    Start = old cycle end + 1 day if exists, else today
    //    End   = start + 1 year - 1 day
    const lastEnd = lastCycle?.cycle_end_date as string | undefined;
    const cycleStart = lastEnd ? addDays(lastEnd, 1) : today();
    const cycleEnd = addDays(addYears(cycleStart, 1), -1);

    // 4. Insert new payment row
    const { data: payment, error: payErr } = await supabase
      .from("license_payments")
      .insert({
        license_key:      licenseKey,
        payment_type:     "one_time",
        base_amount:      base,
        gst_rate:         rate > 0 ? rate : null,
        total_amount:     totalAmount,
        notes:            notes || null,
        payment_source:   "manual_offline",
        product:          "mobile",
        cycle_start_date: cycleStart,
        cycle_end_date:   cycleEnd,
      })
      .select("id")
      .single();

    if (payErr || !payment) {
      return NextResponse.json({ error: payErr?.message || "Failed to create renewal" }, { status: 500 });
    }

    // 5. Insert single installment
    const { error: instErr } = await supabase
      .from("license_payment_installments")
      .insert({
        payment_id:         payment.id,
        license_key:        licenseKey,
        installment_number: 1,
        amount:             totalAmount,
        due_date:           cycleStart,
        paid_date:          markPaid ? today() : null,
        payment_method:     markPaid ? (paidMethod || "cash") : null,
        reference_id:       markPaid ? (paidReference || null) : null,
      });

    if (instErr) {
      await supabase.from("license_payments").delete().eq("id", payment.id);
      return NextResponse.json({ error: instErr.message }, { status: 500 });
    }

    // 6. Extend mobile_addon_expiry by 1 year (from existing expiry if present, else from cycle end)
    const oldExpiry = (lic as any).mobile_addon_expiry as string | null;
    const newExpiry = oldExpiry ? addYears(oldExpiry, 1) : cycleEnd;

    await supabase
      .from("desktop_licenses")
      .update({
        mobile_addon: true,
        mobile_addon_type: "yearly",
        mobile_addon_expiry: newExpiry,
      })
      .eq("license_key", licenseKey);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      cycleStart,
      cycleEnd,
      newExpiry,
    });
  } catch (err) {
    console.error("renew-mobile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
