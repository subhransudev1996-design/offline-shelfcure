import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser, userCanAccessLead } from "@/lib/sales/auth";

// GET /api/sales/timeline/:leadId — full activity history for a lead,
// newest first. Each row: { id, event_type, payload, actor_id, actor_name, created_at }.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { leadId } = await params;
  const supabase = createServiceClient();

  const allowed = await userCanAccessLead(supabase, leadId, auth.userId, auth.profile.role);
  if (!allowed)
    return NextResponse.json({ error: "Lead not assigned to you" }, { status: 403 });

  const { data, error } = await supabase
    .from("lead_timeline")
    .select(`
      id, event_type, payload, actor_id, created_at,
      sales_profiles!lead_timeline_actor_id_fkey(full_name)
    `)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = (data ?? []).map((r) => {
    const actor = r.sales_profiles as unknown as { full_name: string } | null;
    return {
      id:         r.id,
      event_type: r.event_type,
      payload:    r.payload,
      actor_id:   r.actor_id,
      actor_name: actor?.full_name ?? null,
      created_at: r.created_at,
    };
  });

  return NextResponse.json({ events });
}
