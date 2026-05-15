import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser, userCanAccessLead } from "@/lib/sales/auth";
import { recomputePriority } from "@/lib/leads/priority";
import { recordEvent } from "@/lib/leads/events";

// POST /api/sales/trials — upsert a lead's trial.
// Body fields (all optional except lead_id):
//   { lead_id, start_date, expiry_date, last_active_date,
//     conversion_probability, notes, mark_used }
// `mark_used: true` is a shortcut: bumps login_count and sets
// last_active_date to today.
export async function POST(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const leadId = body.lead_id as string | undefined;
    if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    const supabase = createServiceClient();
    const allowed = await userCanAccessLead(supabase, leadId, auth.userId, auth.profile.role);
    if (!allowed)
      return NextResponse.json({ error: "Lead not assigned to you" }, { status: 403 });

    const { data: existing } = await supabase
      .from("lead_trials")
      .select("id, login_count")
      .eq("lead_id", leadId)
      .maybeSingle();

    const today = new Date().toISOString().slice(0, 10);

    // Common patch from request body.
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.start_date === "string")      patch.start_date = body.start_date;
    if (typeof body.expiry_date === "string")     patch.expiry_date = body.expiry_date;
    if (typeof body.last_active_date === "string") patch.last_active_date = body.last_active_date;
    if (typeof body.conversion_probability === "number") {
      patch.conversion_probability =
        Math.max(0, Math.min(100, Math.round(body.conversion_probability)));
    }
    if (typeof body.notes === "string") patch.notes = body.notes.trim() || null;
    if (body.mark_used === true) {
      patch.last_active_date = today;
      patch.login_count = (existing?.login_count ?? 0) + 1;
    }

    let trial: Record<string, unknown> | null = null;

    if (existing) {
      const { data, error } = await supabase
        .from("lead_trials")
        .update(patch)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      trial = data;
    } else {
      const { data, error } = await supabase
        .from("lead_trials")
        .insert({
          lead_id:     leadId,
          start_date:  patch.start_date ?? today,
          expiry_date: patch.expiry_date ?? null,
          login_count: body.mark_used === true ? 1 : 0,
          last_active_date: body.mark_used === true ? today : (patch.last_active_date ?? null),
          conversion_probability: patch.conversion_probability ?? null,
          notes:       patch.notes ?? null,
        })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      trial = data;

      // First-time trial activation bumps the lead's status.
      await supabase
        .from("leads")
        .update({ status: "trial_activated", updated_at: new Date().toISOString() })
        .eq("id", leadId);
    }

    // Log the right event flavour for the timeline.
    const eventType = !existing
      ? "trial_started"
      : (body.mark_used === true ? "trial_used" : "trial_updated");
    await recordEvent(supabase, {
      leadId,
      actorId: auth.userId,
      eventType,
      payload: {
        expiry_date: trial?.expiry_date ?? null,
        login_count: trial?.login_count ?? null,
      },
    });

    await recomputePriority(supabase, leadId);
    return NextResponse.json({ success: true, trial });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
