import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey, medicineId, medicineName,
      batchNumber, expiryDate, quantity,
      purchaseRate, mrp, sellingPrice, gstPercentage,
      supplierName, notes,
    } = await req.json();

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (!medicineName?.trim())
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

    const { data, error } = await supabase
      .from("pending_stock_additions")
      .insert({
        license_key:    licenseKey.trim(),
        medicine_id:    medicineId   ?? null,
        medicine_name:  medicineName.trim(),
        batch_number:   batchNumber?.trim()  || null,
        expiry_date:    expiryDate?.trim()   || null,
        quantity:       Number(quantity),
        purchase_rate:  Number(purchaseRate) || 0,
        mrp:            Number(mrp)          || 0,
        selling_price:  sellingPrice ? Number(sellingPrice) : null,
        gst_percentage: Number(gstPercentage) || 0,
        supplier_name:  supplierName?.trim() || null,
        notes:          notes?.trim()        || null,
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
