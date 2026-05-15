import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";
import { distanceMeters, CHECK_IN_RADIUS_M, isCoord } from "@/lib/sales/geo";
import { recordEvent } from "@/lib/leads/events";

// POST — start a visit. Body: { lead_id, lat, lng }
// Rules:
//  - the lead must be visible to the caller (assigned, or caller is admin);
//  - only one open visit per user at a time;
//  - if the lead has no saved pin yet, the check-in location becomes its pin.
export async function POST(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { lead_id, lat, lng } = await req.json();
    if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });
    if (!isCoord(lat) || !isCoord(lng))
      return NextResponse.json({ error: "Valid GPS coordinates required" }, { status: 400 });

    const supabase = createServiceClient();

    // Lead must exist and be visible to this user.
    const { data: lead } = await supabase
      .from("leads")
      .select("id, assigned_to, gps_lat, gps_lng")
      .eq("id", lead_id)
      .maybeSingle();
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (auth.profile.role !== "admin" && lead.assigned_to !== auth.userId)
      return NextResponse.json({ error: "This lead is not assigned to you" }, { status: 403 });

    // Reject if the user already has an open visit.
    const { data: open } = await supabase
      .from("lead_visits")
      .select("id, lead_id, check_in_at")
      .eq("sales_user_id", auth.userId)
      .is("check_out_at", null)
      .maybeSingle();
    if (open)
      return NextResponse.json(
        { error: "You already have an open visit. Check out first.", openVisit: open },
        { status: 409 }
      );

    // Distance from the saved pin (if any).
    let distance: number | null = null;
    let withinRadius: boolean | null = null;
    if (isCoord(lead.gps_lat) && isCoord(lead.gps_lng)) {
      distance = Math.round(distanceMeters(lat, lng, lead.gps_lat, lead.gps_lng));
      withinRadius = distance <= CHECK_IN_RADIUS_M;
    } else {
      // First visit — pin the lead at the check-in location.
      await supabase.from("leads").update({ gps_lat: lat, gps_lng: lng }).eq("id", lead_id);
    }

    const { data: visit, error } = await supabase
      .from("lead_visits")
      .insert({
        lead_id,
        sales_user_id:       auth.userId,
        check_in_at:         new Date().toISOString(),
        check_in_lat:        lat,
        check_in_lng:        lng,
        distance_from_pin_m: distance,
        within_radius:       withinRadius,
      })
      .select("id, lead_id, check_in_at, distance_from_pin_m, within_radius")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordEvent(supabase, {
      leadId: lead_id,
      actorId: auth.userId,
      eventType: "visit_check_in",
      payload: {
        visit_id: visit.id,
        distance_from_pin_m: distance,
        within_radius: withinRadius,
      },
    });

    return NextResponse.json({ success: true, visit });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
