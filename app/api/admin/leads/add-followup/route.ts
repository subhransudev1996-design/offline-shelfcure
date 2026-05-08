import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_TYPES    = ["call", "whatsapp", "visit", "email", "demo"];
const VALID_OUTCOMES = ["interested", "not_interested", "callback", "demo_scheduled", "closed_won", "closed_lost", "no_answer"];
const VALID_STATUSES = ["new", "contacted", "interested", "demo_done", "negotiating", "converted", "lost"];

export async function POST(req: NextRequest) {
  try {
    const {
      lead_id,
      type,
      notes,
      outcome,
      next_followup_date,
      update_status,
    } = await req.json();

    if (!lead_id)    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    if (!notes?.trim()) return NextResponse.json({ error: "Notes required" }, { status: 400 });

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("lead_followups")
      .insert({
        lead_id,
        type:               VALID_TYPES.includes(type) ? type : "call",
        notes:              notes.trim(),
        outcome:            VALID_OUTCOMES.includes(outcome) ? outcome : null,
        next_followup_date: next_followup_date || null,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Optionally update lead status and always bump updated_at
    const leadUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (update_status && VALID_STATUSES.includes(update_status)) {
      leadUpdate.status = update_status;
    }

    await supabase.from("leads").update(leadUpdate).eq("id", lead_id);

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
