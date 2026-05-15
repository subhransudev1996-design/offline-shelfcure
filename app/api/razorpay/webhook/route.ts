import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";
import { generateLicenseKey } from "@/lib/license";
import { sendPurchaseConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.event !== "payment.captured") {
      return NextResponse.json({ received: true });
    }

    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    const supabase = createServiceClient();

    const { data: purchase } = await supabase
      .from("web_orders")
      .select("*")
      .eq("razorpay_order_id", orderId)
      .single();

    if (!purchase || purchase.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    await supabase
      .from("web_orders")
      .update({ payment_status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq("razorpay_order_id", orderId);

    const licenseKey = generateLicenseKey();
    await supabase.from("licenses").insert({ purchase_id: purchase.id, license_key: licenseKey, email: purchase.email });

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
      orderId,
      amountBase: purchase.amount_base / 100,
      amountGst: purchase.amount_gst / 100,
      amountTotal: purchase.amount_total / 100,
      gstin: purchase.gstin,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
