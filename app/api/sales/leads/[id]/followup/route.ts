import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser, userCanAccessLead } from "@/lib/sales/auth";
import { recomputePriority } from "@/lib/leads/priority";
import { recordEvent } from "@/lib/leads/events";
import { LEAD_STATUS_VALUES } from "@/lib/leads/constants";

const VALID_TYPES    = ["call", "whatsapp", "visit", "email", "demo"];
const VALID_OUTCOMES = [
  "interested", "not_interested", "callback",
  "demo_scheduled", "closed_won", "closed_lost", "no_answer",
];

// POST /api/sales/leads/:id/followup
// Log a follow-up activity from the mobile app. Optionally bumps lead.status
// and refreshes the priority score.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id: leadId } = await params;
    const { type, notes, outcome, next_followup_date, update_status } =
      await req.json();

    if (!notes?.trim())
      return NextResponse.json({ error: "Notes required" }, { status: 400 });

    const supabase = createServiceClient();

    const allowed = await userCanAccessLead(supabase, leadId, auth.userId, auth.profile.role);
    if (!allowed)
      return NextResponse.json({ error: "Lead not assigned to you" }, { status: 403 });

    const { data, error } = await supabase
      .from("lead_followups")
      .insert({
        lead_id:            leadId,
        type:               VALID_TYPES.includes(type) ? type : "call",
        notes:              notes.trim(),
        outcome:            VALID_OUTCOMES.includes(outcome) ? outcome : null,
        next_followup_date: next_followup_date || null,
      })
      .select("id, lead_id, type, notes, outcome, next_followup_date, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const leadUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof update_status === "string" && LEAD_STATUS_VALUES.includes(update_status)) {
      leadUpdate.status = update_status;
    }
    await supabase.from("leads").update(leadUpdate).eq("id", leadId);

    await recordEvent(supabase, {
      leadId,
      actorId: auth.userId,
      eventType: "followup",
      payload: {
        type: data.type,
        outcome: data.outcome,
        notes_preview: (data.notes ?? "").slice(0, 200),
        next_followup_date: data.next_followup_date,
      },
    });
    await recomputePriority(supabase, leadId);

    return NextResponse.json({ success: true, followup: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
