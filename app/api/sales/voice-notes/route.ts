import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser, userCanAccessLead } from "@/lib/sales/auth";
import { recordEvent } from "@/lib/leads/events";

// POST /api/sales/voice-notes — body: { lead_id, transcript, duration_seconds? }
// On-device speech-to-text on the phone already turned the audio into text;
// only the transcript is persisted (no audio upload — by project decision).
export async function POST(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { lead_id, transcript, duration_seconds } = await req.json();
    if (!lead_id)               return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    if (typeof transcript !== "string" || !transcript.trim())
      return NextResponse.json({ error: "transcript required" }, { status: 400 });

    const supabase = createServiceClient();
    const allowed = await userCanAccessLead(supabase, lead_id, auth.userId, auth.profile.role);
    if (!allowed)
      return NextResponse.json({ error: "Lead not assigned to you" }, { status: 403 });

    await recordEvent(supabase, {
      leadId: lead_id,
      actorId: auth.userId,
      eventType: "voice_note",
      payload: {
        transcript: transcript.trim(),
        duration_seconds:
          typeof duration_seconds === "number" && isFinite(duration_seconds)
            ? Math.round(duration_seconds) : null,
      },
    });

    // Bump updated_at so list ordering reflects the activity.
    await supabase.from("leads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", lead_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
