import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Shape of a single line item submitted by the scanner POS.
interface SaleItemInput {
  medicine_id: number;
  batch_id?: number | null;
  medicine_name?: string;
  quantity: number;
  units_per_pack?: number;
  mrp: number;
  selling_price?: number;
  discount_percentage?: number;
  gst_percentage: number;
  selling_unit?: "pack" | "unit";
  is_misc?: boolean;
  misc_note?: string;
}

interface PaymentInput {
  method: string;              // 'cash' | 'upi' | 'card' | 'cheque' | 'neft' | 'credit'
  amount: number;
  reference_number?: string;
}

function num(v: unknown, def = 0): number {
  return typeof v === "number" && isFinite(v) ? v : def;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function sanitizeItems(raw: unknown): SaleItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: SaleItemInput[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return null;
    const o = r as Record<string, unknown>;
    const is_misc    = o.is_misc === true;
    const medicine_id = num(o.medicine_id, 0);
    const quantity    = num(o.quantity, 0);
    const mrp         = num(o.mrp, 0);
    const gst_percentage = num(o.gst_percentage, 0);
    if ((!is_misc && medicine_id <= 0) || quantity <= 0 || mrp <= 0) return null;
    out.push({
      medicine_id,
      batch_id:           typeof o.batch_id === "number" ? o.batch_id : null,
      medicine_name:      str(o.medicine_name),
      quantity,
      units_per_pack:     typeof o.units_per_pack === "number" && o.units_per_pack > 0 ? o.units_per_pack : 1,
      mrp,
      selling_price:      typeof o.selling_price === "number" ? o.selling_price : undefined,
      discount_percentage: typeof o.discount_percentage === "number" ? o.discount_percentage : undefined,
      gst_percentage,
      selling_unit:       (o.selling_unit === "unit" || o.selling_unit === "pack") ? o.selling_unit : "pack",
      is_misc,
      misc_note:          is_misc ? (str(o.misc_note) ?? "Misc Charge") : undefined,
    });
  }
  return out;
}

function sanitizePayments(raw: unknown): PaymentInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: PaymentInput[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return null;
    const o = r as Record<string, unknown>;
    const method = str(o.method);
    const amount = num(o.amount, 0);
    if (!method || amount <= 0) return null;
    out.push({ method, amount, reference_number: str(o.reference_number) });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      licenseKey, billDate, isPrescriptionSale, notes,
      doctorName,
      customerId, customerType, customerName, customerPhone,
      customerGstin, customerState, customerAddress,
      subtotal, discountAmount, taxableAmount, gstAmount, totalAmount,
      items, payments,
    } = body;

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const cleanItems = sanitizeItems(items);
    if (!cleanItems)
      return NextResponse.json({ error: "Invalid or empty items" }, { status: 400 });

    const cleanPayments = sanitizePayments(payments);
    if (!cleanPayments)
      return NextResponse.json({ error: "Invalid or empty payments" }, { status: 400 });

    const supabase = createServiceClient();

    // Verify license
    const { data: lic, error: licErr } = await supabase
      .from("desktop_licenses")
      .select("status")
      .eq("license_key", licenseKey.trim())
      .single();
    if (licErr || !lic)
      return NextResponse.json({ error: "Invalid license key" }, { status: 404 });
    if (lic.status !== "active")
      return NextResponse.json({ error: "License is not active" }, { status: 403 });

    // Insert pending sale row. Desktop's apply_pending_sales picks it up and
    // creates the real sale (bill number is generated then).
    const { data, error } = await supabase
      .from("pending_sales")
      .insert({
        license_key:          licenseKey.trim(),
        bill_date:            (typeof billDate === "string" && billDate.trim()) ? billDate.trim() : new Date().toISOString(),
        is_prescription_sale: isPrescriptionSale ? 1 : 0,
        notes:                str(notes) ?? null,
        doctor_name:          str(doctorName) ?? null,

        customer_id:          typeof customerId === "number" ? customerId : null,
        customer_type:        (customerType === "b2b" ? "b2b" : "b2c"),
        customer_name:        str(customerName) ?? null,
        customer_phone:       str(customerPhone) ?? null,
        customer_gstin:       str(customerGstin) ?? null,
        customer_state:       str(customerState) ?? null,
        customer_address:     str(customerAddress) ?? null,

        subtotal:             num(subtotal),
        discount_amount:      num(discountAmount),
        taxable_amount:       num(taxableAmount),
        gst_amount:           num(gstAmount),
        total_amount:         num(totalAmount),

        items:    cleanItems,
        payments: cleanPayments,

        status: "pending",
      })
      .select("id")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
