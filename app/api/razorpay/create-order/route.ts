import { NextRequest, NextResponse } from "next/server";
import { razorpay, PRICE_TOTAL, PRICE_BASE, PRICE_GST } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, gstin } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: PRICE_TOTAL,
      currency: "INR",
      receipt: `sc_${Date.now()}`,
      notes: { customer_name: name, email, phone, gstin: gstin || "" },
    });

    const supabase = createServiceClient();
    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert({
        razorpay_order_id: order.id,
        customer_name: name,
        email,
        phone,
        gstin: gstin || null,
        amount_base: PRICE_BASE,
        amount_gst: PRICE_GST,
        amount_total: PRICE_TOTAL,
        payment_status: "pending",
        plan_type: "lifetime",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      orderId: order.id,
      amount: PRICE_TOTAL,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      purchaseId: purchase.id,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
