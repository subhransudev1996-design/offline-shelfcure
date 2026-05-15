import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";
import { distanceMeters, isCoord } from "@/lib/sales/geo";

// GET /api/sales/nearby?lat=..&lng=..&radius=1000
// Leads assigned to the caller that have a saved GPS pin within `radius`
// metres of the given point, sorted nearest-first. (admin → all leads.)
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius")) || 1000;

  if (!isCoord(lat) || !isCoord(lng))
    return NextResponse.json({ error: "lat and lng query params required" }, { status: 400 });

  const supabase = createServiceClient();
  let query = supabase
    .from("leads")
    .select("id, owner_name, pharmacy_name, phone, city, status, gps_lat, gps_lng")
    .not("gps_lat", "is", null)
    .not("gps_lng", "is", null);

  if (auth.profile.role !== "admin") query = query.eq("assigned_to", auth.userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const nearby = (data ?? [])
    .map((l) => ({
      ...l,
      distance_m: Math.round(distanceMeters(lat, lng, l.gps_lat, l.gps_lng)),
    }))
    .filter((l) => l.distance_m <= radius)
    .sort((a, b) => a.distance_m - b.distance_m);

  return NextResponse.json({ leads: nearby });
}
