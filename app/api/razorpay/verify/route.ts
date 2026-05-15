import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";
import { generateLicenseKey } from "@/lib/license";
import { sendPurchaseConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchase_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchase_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: purchase, error: fetchErr } = await supabase
      .from("web_orders")
      .select("*")
      .eq("id", purchase_id)
      .single();

    if (fetchErr || !purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.payment_status === "paid") {
      const { data: existingLicense } = await supabase
        .from("licenses")
        .select("license_key")
        .eq("purchase_id", purchase_id)
        .single();
      return NextResponse.json({ licenseKey: existingLicense?.license_key });
    }

    await supabase
      .from("web_orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", purchase_id);

    const licenseKey = generateLicenseKey();

    await supabase.from("licenses").insert({
      purchase_id,
      license_key: licenseKey,
      email: purchase.email,
    });

    // Mirror into desktop_licenses so admin panel sees it as a normal license
    await supabase.from("desktop_licenses").insert({
      license_key: licenseKey,
      pharmacy_name: purchase.customer_name || purchase.email,
      contact_email: purchase.email,
      contact_phone: purchase.phone || null,
      plan: "standard",
      license_type: "lifetime",
      status: "active",
      max_machines: 1,
      activated_machines: [],
    });

    // Auto-attach a paid one-time payment plan from the Razorpay charge
    const totalRupees = (purchase.amount_total ?? 0) / 100;
    const today = new Date().toISOString().split("T")[0];

    const { data: paymentRow } = await supabase
      .from("license_payments")
      .insert({
        license_key: licenseKey,
        payment_type: "one_time",
        payment_source: "razorpay_online",
        total_amount: totalRupees,
        razorpay_order_id,
        razorpay_payment_id,
        notes: "Auto-created from Razorpay payment",
      })
      .select("id")
      .single();

    if (paymentRow) {
      await supabase.from("license_payment_installments").insert({
        payment_id: paymentRow.id,
        license_key: licenseKey,
        installment_number: 1,
        amount: totalRupees,
        due_date: today,
        paid_date: today,
        payment_method: "razorpay",
        reference_id: razorpay_payment_id,
      });
    }

    const { data: latestVersion } = await supabase
      .from("software_versions")
      .select("download_url, version")
      .eq("is_latest", true)
      .single();

    await sendPurchaseConfirmation({
      customerName: purchase.customer_name,
      email: purchase.email,
      licenseKey,
      downloadUrl: latestVersion?.download_url || "",
      version: latestVersion?.version || "1.0.0",
      orderId: razorpay_order_id,
      amountBase: purchase.amount_base / 100,
      amountGst: purchase.amount_gst / 100,
      amountTotal: purchase.amount_total / 100,
      gstin: purchase.gstin,
    });

    return NextResponse.json({ success: true, licenseKey });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
