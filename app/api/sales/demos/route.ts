import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser, userCanAccessLead } from "@/lib/sales/auth";
import { recomputePriority } from "@/lib/leads/priority";
import { recordEvent, pushNotification } from "@/lib/leads/events";

// GET — demos the caller is responsible for conducting.
//        admin → every demo. else → conducted_by = me.
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();
  let query = supabase
    .from("lead_demos")
    .select(`
      id, lead_id, conducted_by, scheduled_at, status, duration_minutes,
      notes, questions_asked, interest_level, conversion_probability,
      completed_at, created_at,
      leads(owner_name, pharmacy_name, phone, city)
    `)
    .order("scheduled_at", { ascending: true });

  if (auth.profile.role !== "admin") query = query.eq("conducted_by", auth.userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ demos: data ?? [] });
}

// POST — schedule a demo for a lead. Body:
//   { lead_id, scheduled_at (ISO), conducted_by? (defaults to caller),
//     duration_minutes? }
export async function POST(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { lead_id, scheduled_at, conducted_by, duration_minutes } = await req.json();
    if (!lead_id)      return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    if (!scheduled_at) return NextResponse.json({ error: "scheduled_at required" }, { status: 400 });

    const supabase = createServiceClient();

    const allowed = await userCanAccessLead(supabase, lead_id, auth.userId, auth.profile.role);
    if (!allowed)
      return NextResponse.json({ error: "Lead not assigned to you" }, { status: 403 });

    // If a conductor is specified, verify they are active sales staff.
    let conductor = (typeof conducted_by === "string" && conducted_by) || auth.userId;
    const { data: emp } = await supabase
      .from("sales_profiles")
      .select("id, is_active")
      .eq("id", conductor)
      .maybeSingle();
    if (!emp || !emp.is_active)
      return NextResponse.json({ error: "Conductor is not a valid active employee" }, { status: 400 });

    const { data, error } = await supabase
      .from("lead_demos")
      .insert({
        lead_id,
        conducted_by:     conductor,
        scheduled_at,
        status:           "scheduled",
        duration_minutes: typeof duration_minutes === "number" ? duration_minutes : null,
      })
      .select("id, lead_id, conducted_by, scheduled_at, status, duration_minutes, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Bump lead status to demo_scheduled and refresh priority.
    await supabase.from("leads")
      .update({ status: "demo_scheduled", updated_at: new Date().toISOString() })
      .eq("id", lead_id);

    await recordEvent(supabase, {
      leadId: lead_id,
      actorId: auth.userId,
      eventType: "demo_scheduled",
      payload: { demo_id: data.id, scheduled_at: data.scheduled_at, conducted_by: conductor },
    });

    // Notify the conductor if it's someone other than the caller.
    if (conductor !== auth.userId) {
      // Look up pharmacy name for the notification body.
      const { data: lead } = await supabase
        .from("leads")
        .select("owner_name, pharmacy_name")
        .eq("id", lead_id)
        .maybeSingle();
      const leadLabel = lead?.pharmacy_name || lead?.owner_name || "a lead";
      await pushNotification(supabase, {
        userId: conductor,
        kind:   "demo_assigned",
        title:  "New demo assigned to you",
        body:   `${leadLabel} · ${new Date(data.scheduled_at).toLocaleString()}`,
        leadId: lead_id,
      });
    }

    await recomputePriority(supabase, lead_id);
    return NextResponse.json({ success: true, demo: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
