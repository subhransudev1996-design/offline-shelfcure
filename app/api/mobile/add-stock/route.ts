import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Shape sent by the scanner's "Add New Medicine" flow.
// All fields except `name` are optional — the desktop will fall back to
// safe defaults (Box dosage form, pack_only, etc.) when fields are missing.
interface NewMedicineInput {
  name: string;
  manufacturer?: string;
  strength?: string;
  dosage_form_name?: string;
  pack_size?: number;
  pack_unit?: string;
  units_per_pack?: number;
  sale_unit_mode?: string; // "pack_only" | "both"
  gst_rate?: number;
  hsn_code?: string;
  salt_composition?: string;
}

function sanitizeNewMedicine(raw: unknown): NewMedicineInput | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const name = typeof m.name === "string" ? m.name.trim() : "";
  if (!name) return null;
  const str = (k: string) => (typeof m[k] === "string" && (m[k] as string).trim() ? (m[k] as string).trim() : undefined);
  const num = (k: string) => (typeof m[k] === "number" && isFinite(m[k] as number) ? (m[k] as number) : undefined);
  return {
    name,
    manufacturer:     str("manufacturer"),
    strength:         str("strength"),
    dosage_form_name: str("dosage_form_name"),
    pack_size:        num("pack_size"),
    pack_unit:        str("pack_unit"),
    units_per_pack:   num("units_per_pack"),
    sale_unit_mode:   str("sale_unit_mode"),
    gst_rate:         num("gst_rate"),
    hsn_code:         str("hsn_code"),
    salt_composition: str("salt_composition"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey, medicineId, medicineName,
      batchNumber, expiryDate, quantity,
      purchaseRate, mrp, sellingPrice, gstPercentage,
      supplierName, notes, barcode,
      newMedicine,
    } = await req.json();

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    // Resolve medicineName: when adding a brand-new medicine, prefer its name
    // so the desktop side has the same string for fallback lookups.
    const cleanNewMedicine = sanitizeNewMedicine(newMedicine);
    const resolvedName: string | null =
      (typeof medicineName === "string" && medicineName.trim()) ? medicineName.trim()
      : cleanNewMedicine?.name ?? null;

    if (!resolvedName)
      return NextResponse.json({ error: "Missing medicineName" }, { status: 400 });
    if (!quantity || quantity < 1)
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });

    const supabase = createServiceClient();

    // Verify license is active
    const { data: lic, error: licErr } = await supabase
      .from("desktop_licenses")
      .select("status")
      .eq("license_key", licenseKey.trim())
      .single();

    if (licErr || !lic)
      return NextResponse.json({ error: "Invalid license key" }, { status: 404 });
    if (lic.status !== "active")
      return NextResponse.json({ error: "License is not active" }, { status: 403 });

    // Server-side duplicate check: when adding a brand-new medicine, verify
    // no medicine with the same name already exists in this pharmacy's cache.
    if (cleanNewMedicine) {
      const { data: existing } = await supabase
        .from("pharmacy_medicine_cache")
        .select("medicine_id, name")
        .eq("license_key", licenseKey.trim())
        .ilike("name", cleanNewMedicine.name)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          {
            error: `"${existing.name}" already exists in your inventory. Use Add Stock Batch to add a new batch instead.`,
            duplicate: true,
            existingMedicineId: existing.medicine_id,
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("pending_stock_additions")
      .insert({
        license_key:    licenseKey.trim(),
        medicine_id:    medicineId   ?? null,
        medicine_name:  resolvedName,
        batch_number:   batchNumber?.trim()  || null,
        expiry_date:    expiryDate?.trim()   || null,
        quantity:       Number(quantity),
        purchase_rate:  Number(purchaseRate) || 0,
        mrp:            Number(mrp)          || 0,
        selling_price:  sellingPrice ? Number(sellingPrice) : null,
        gst_percentage: Number(gstPercentage) || 0,
        supplier_name:  supplierName?.trim() || null,
        notes:          notes?.trim()        || null,
        barcode:        (typeof barcode === "string" && barcode.trim()) ? barcode.trim() : null,
        new_medicine:   cleanNewMedicine,    // null when omitted (existing flow)
        status:         "pending",
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
