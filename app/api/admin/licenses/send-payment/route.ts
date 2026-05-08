import { NextResponse } from "next/server";
import { sendPaymentLink } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, pharmacyName, paymentLink } = await req.json();

    if (!email || !paymentLink) {
      return NextResponse.json({ error: "Email and Payment Link are required" }, { status: 400 });
    }

    await sendPaymentLink({ email, pharmacyName, paymentLink });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
