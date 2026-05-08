import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/telegram";
import { day0, DRIP_STEPS, TrialContext } from "@/lib/drip-messages";

// Telegram calls this endpoint for every bot event
export async function POST(req: NextRequest) {
  // Verify the request came from Telegram
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers.get("x-telegram-bot-api-secret-token");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: TelegramUpdate;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }

  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Handle /start with deep link payload: /start SC-TRIAL-XXXX-XXXX
  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1]?.trim();
    if (payload && payload.startsWith("SC-TRIAL-")) {
      await handleTrialStart(chatId, payload);
    } else {
      await sendMessage(
        chatId,
        `👋 <b>Welcome to ShelfCure!</b>\n\nThis bot is for ShelfCure trial users.\n\nStart your free trial at:\nhttps://shelfcure.com/trial`
      );
    }
    return NextResponse.json({ ok: true });
  }

  // Handle EXTEND request (day 7 flow)
  if (text.toUpperCase() === "EXTEND") {
    await handleExtend(chatId);
    return NextResponse.json({ ok: true });
  }

  // Generic fallback — guide to support
  await sendMessage(
    chatId,
    `💬 I received your message!\n\nFor support, reach us on WhatsApp:\nhttps://wa.me/${process.env.WHATSAPP_NUMBER || "917064844320"}\n\nOr email: support@shelfcure.com`
  );

  return NextResponse.json({ ok: true });
}

async function handleTrialStart(chatId: number, trialKey: string) {
  const supabase = createServiceClient();

  const { data: trial } = await supabase
    .from("trial_requests")
    .select("id, name, email, trial_license_key, trial_expires_at, drip_steps_sent, converted")
    .eq("trial_license_key", trialKey)
    .maybeSingle();

  if (!trial) {
    await sendMessage(
      chatId,
      `❌ Trial key not found. Please check the link from your email.\n\nNeed help? Contact us:\nhttps://wa.me/${process.env.WHATSAPP_NUMBER || "917064844320"}`
    );
    return;
  }

  if (trial.converted) {
    await sendMessage(
      chatId,
      `✅ <b>Hi ${trial.name}!</b>\n\nYou're already a ShelfCure customer. Your license is active.\n\nNeed help? Contact support:\nhttps://wa.me/${process.env.WHATSAPP_NUMBER || "917064844320"}`
    );
    return;
  }

  // Check if they already connected (already have a chat_id)
  const { data: existing } = await supabase
    .from("trial_requests")
    .select("telegram_chat_id")
    .eq("id", trial.id)
    .single();

  const alreadyConnected = !!existing?.telegram_chat_id;

  // Save chat_id and mark step 0 sent
  const currentSteps: number[] = trial.drip_steps_sent ?? [];
  const updatedSteps = currentSteps.includes(0) ? currentSteps : [...currentSteps, 0];

  await supabase
    .from("trial_requests")
    .update({ telegram_chat_id: String(chatId), drip_steps_sent: updatedSteps })
    .eq("id", trial.id);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const downloadUrl = await getLatestDownloadUrl(supabase);

  const ctx: TrialContext = {
    name: trial.name,
    trialKey: trial.trial_license_key,
    expiresAt: trial.trial_expires_at,
    downloadUrl,
  };

  if (alreadyConnected) {
    await sendMessage(
      chatId,
      `👋 <b>Welcome back, ${trial.name}!</b>\n\nYour trial is still active until <b>${new Date(trial.trial_expires_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</b>.\n\n🔑 Trial Key: <code>${trial.trial_license_key}</code>\n\nNeed help? Just ask! 💬`
    );
    return;
  }

  // Send Day 0 welcome message
  await sendMessage(chatId, day0(ctx));
}

async function handleExtend(chatId: number) {
  const supabase = createServiceClient();

  const { data: trial } = await supabase
    .from("trial_requests")
    .select("id, name, trial_expires_at, converted")
    .eq("telegram_chat_id", String(chatId))
    .maybeSingle();

  if (!trial) {
    await sendMessage(chatId, `❌ I couldn't find your trial. Please contact us:\nhttps://wa.me/${process.env.WHATSAPP_NUMBER || "917064844320"}`);
    return;
  }

  if (trial.converted) {
    await sendMessage(chatId, `✅ You're already a ShelfCure customer! No extension needed.`);
    return;
  }

  // Extend by 3 days from current expiry (or from now if already expired)
  const currentExpiry = new Date(trial.trial_expires_at);
  const base = currentExpiry > new Date() ? currentExpiry : new Date();
  const newExpiry = new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000);

  await supabase
    .from("trial_requests")
    .update({ trial_expires_at: newExpiry.toISOString() })
    .eq("id", trial.id);

  const newExpiryText = newExpiry.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  await sendMessage(
    chatId,
    `🎉 <b>Done, ${trial.name}!</b>\n\nYour trial has been extended by 3 days.\n\n⏰ New expiry: <b>${newExpiryText}</b>\n\nHope this gives you enough time to explore ShelfCure fully!\n\nWhen you're ready to buy: https://shelfcure.com/checkout`
  );
}

async function getLatestDownloadUrl(supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  try {
    const { data } = await supabase
      .from("software_versions")
      .select("download_url")
      .eq("is_latest", true)
      .single();
    return data?.download_url || "";
  } catch {
    return "";
  }
}

// Minimal Telegram update types
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name: string; username?: string };
    text?: string;
  };
}
