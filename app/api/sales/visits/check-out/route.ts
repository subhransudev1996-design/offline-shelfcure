import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";
import { isCoord } from "@/lib/sales/geo";
import { recordEvent } from "@/lib/leads/events";

// POST — end a visit. Body: { visit_id, lat?, lng?, notes? }
export async function POST(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { visit_id, lat, lng, notes } = await req.json();
    if (!visit_id) return NextResponse.json({ error: "visit_id required" }, { status: 400 });

    const supabase = createServiceClient();

    const { data: visit } = await supabase
      .from("lead_visits")
      .select("id, sales_user_id, check_in_at, check_out_at")
      .eq("id", visit_id)
      .maybeSingle();
    if (!visit) return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    if (visit.sales_user_id !== auth.userId)
      return NextResponse.json({ error: "This visit is not yours" }, { status: 403 });
    if (visit.check_out_at)
      return NextResponse.json({ error: "Visit already checked out" }, { status: 409 });

    const now = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((now.getTime() - new Date(visit.check_in_at).getTime()) / 1000)
    );

    const { error } = await supabase
      .from("lead_visits")
      .update({
        check_out_at:     now.toISOString(),
        check_out_lat:    isCoord(lat) ? lat : null,
        check_out_lng:    isCoord(lng) ? lng : null,
        duration_seconds: durationSeconds,
        notes:            typeof notes === "string" && notes.trim() ? notes.trim() : null,
      })
      .eq("id", visit_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch lead_id for the timeline event.
    const { data: full } = await supabase
      .from("lead_visits")
      .select("lead_id")
      .eq("id", visit_id)
      .single();
    if (full?.lead_id) {
      await recordEvent(supabase, {
        leadId: full.lead_id,
        actorId: auth.userId,
        eventType: "visit_check_out",
        payload: { visit_id, duration_seconds: durationSeconds, notes_preview: (typeof notes === "string" ? notes : "").slice(0, 200) },
      });
    }

    return NextResponse.json({ success: true, durationSeconds });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
