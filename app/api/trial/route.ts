import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateTrialKey } from "@/lib/license";
import { sendTrialWelcome } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone } = await req.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("trial_requests")
      .select("id, trial_expires_at")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      const expired = existing.trial_expires_at && new Date(existing.trial_expires_at) < new Date();
      if (!expired) {
        return NextResponse.json({ error: "A trial for this email already exists." }, { status: 409 });
      }
    }

    const trialKey = generateTrialKey();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("trial_requests").upsert({
      name,
      email,
      phone,
      trial_license_key: trialKey,
      trial_expires_at: expiresAt,
      download_sent: false,
      converted: false,
      ip_address: ip,
    }, { onConflict: "email" });

    const { data: latestVersion } = await supabase
      .from("software_versions")
      .select("download_url, version")
      .eq("is_latest", true)
      .single();

    await sendTrialWelcome({
      name,
      email,
      trialKey,
      expiresAt,
      downloadUrl: latestVersion?.download_url || "",
      version: latestVersion?.version || "1.0.0",
    });

    await supabase
      .from("trial_requests")
      .update({ download_sent: true })
      .eq("email", email);

    return NextResponse.json({
      success: true,
      message: "Trial email sent",
      trialKey,
      telegramBotUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "",
    });
  } catch (err) {
    console.error("trial error:", err);
    return NextResponse.json({ error: "Failed to process trial request" }, { status: 500 });
  }
}
