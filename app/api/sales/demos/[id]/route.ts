import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";
import { recomputePriority } from "@/lib/leads/priority";
import { recordEvent } from "@/lib/leads/events";

const VALID_STATUSES = ["scheduled", "completed", "no_show", "cancelled"];
const VALID_INTEREST = ["low", "medium", "high"];

// PATCH /api/sales/demos/:id  — update / complete a demo. Body any of:
//   { status, notes, questions_asked, interest_level,
//     conversion_probability, duration_minutes }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServiceClient();

    // Conductor or admin can edit.
    const { data: demo } = await supabase
      .from("lead_demos")
      .select("id, lead_id, conducted_by, status")
      .eq("id", id)
      .maybeSingle();
    if (!demo) return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    if (auth.profile.role !== "admin" && demo.conducted_by !== auth.userId)
      return NextResponse.json({ error: "Not your demo" }, { status: 403 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.status === "string") {
      if (!VALID_STATUSES.includes(body.status))
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      update.status = body.status;
      if (body.status === "completed" && !demo.status.startsWith("completed")) {
        update.completed_at = new Date().toISOString();
      }
    }
    if (typeof body.notes === "string")            update.notes = body.notes.trim() || null;
    if (typeof body.questions_asked === "string")  update.questions_asked = body.questions_asked.trim() || null;
    if (typeof body.interest_level === "string") {
      update.interest_level = VALID_INTEREST.includes(body.interest_level)
        ? body.interest_level : null;
    }
    if (typeof body.conversion_probability === "number") {
      update.conversion_probability = Math.max(0, Math.min(100, Math.round(body.conversion_probability)));
    }
    if (typeof body.duration_minutes === "number") update.duration_minutes = body.duration_minutes;

    const { error } = await supabase.from("lead_demos").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // When a demo completes, bump the lead's status accordingly.
    if (update.status === "completed") {
      await supabase
        .from("leads")
        .update({ status: "demo_done", updated_at: new Date().toISOString() })
        .eq("id", demo.lead_id);
      await recordEvent(supabase, {
        leadId: demo.lead_id,
        actorId: auth.userId,
        eventType: "demo_completed",
        payload: {
          demo_id: id,
          interest_level: update.interest_level,
          conversion_probability: update.conversion_probability,
          notes_preview: typeof update.notes === "string"
            ? (update.notes as string).slice(0, 200)
            : null,
        },
      });
    }
    await recomputePriority(supabase, demo.lead_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
