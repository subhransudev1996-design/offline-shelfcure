import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/telegram";
import { DRIP_STEPS, STEP_DAY_MAP, TrialContext } from "@/lib/drip-messages";

// Runs daily at 9:30 AM IST (4:00 AM UTC) via Vercel Cron
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createServiceClient();

    // Fetch all trial users who connected Telegram and haven't converted yet
    const { data: trials, error } = await supabase
      .from("trial_requests")
      .select("id, name, email, trial_license_key, trial_expires_at, drip_steps_sent, created_at, converted")
      .not("telegram_chat_id", "is", null)
      .eq("converted", false);

    if (error) {
      console.error("trial-drip: fetch error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!trials?.length) {
      return NextResponse.json({ success: true, processed: 0, sent: 0 });
    }

    // Get latest download URL once
    const { data: latestVersion } = await supabase
      .from("software_versions")
      .select("download_url")
      .eq("is_latest", true)
      .single();

    const downloadUrl = latestVersion?.download_url || "";

    // Also need telegram_chat_id — fetch separately (not in type-safe select above)
    const { data: chatIdRows } = await supabase
      .from("trial_requests")
      .select("id, telegram_chat_id")
      .not("telegram_chat_id", "is", null)
      .eq("converted", false);

    const chatIdMap: Record<string, string> = {};
    for (const row of chatIdRows ?? []) {
      if (row.telegram_chat_id) chatIdMap[row.id] = row.telegram_chat_id;
    }

    const now = new Date();
    let sent = 0;
    const errors: string[] = [];

    for (const trial of trials) {
      const chatId = chatIdMap[trial.id];
      if (!chatId) continue;

      const createdAt = new Date(trial.created_at);
      const daysElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const stepsSent: number[] = trial.drip_steps_sent ?? [];

      // Find all steps whose trigger day has arrived but haven't been sent yet
      // Exclude step 0 — that's always sent instantly by webhook on bot start
      const pendingSteps = Object.entries(STEP_DAY_MAP)
        .map(([step, day]) => ({ step: Number(step), day }))
        .filter(({ step, day }) => step !== 0 && day <= daysElapsed && !stepsSent.includes(step))
        .sort((a, b) => a.step - b.step);

      if (!pendingSteps.length) continue;

      const ctx: TrialContext = {
        name: trial.name,
        trialKey: trial.trial_license_key,
        expiresAt: trial.trial_expires_at,
        downloadUrl,
      };

      for (const { step } of pendingSteps) {
        const messageFn = DRIP_STEPS[step];
        if (!messageFn) continue;

        const ok = await sendMessage(chatId, messageFn(ctx));
        if (ok) {
          stepsSent.push(step);
          sent++;
        } else {
          errors.push(`trial ${trial.id} step ${step}: send failed`);
        }
      }

      // Persist updated steps list
      await supabase
        .from("trial_requests")
        .update({ drip_steps_sent: stepsSent })
        .eq("id", trial.id);
    }

    return NextResponse.json({
      success: true,
      processed: trials.length,
      sent,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("trial-drip cron error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
