import { createServiceClient } from "@/lib/supabase/server";
import MapClient, { type MapLead, type MapVisit } from "./MapClient";

export const dynamic = "force-dynamic";

export default async function SalesMapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const supabase = createServiceClient();

  // Leads with a saved pin — colour-coded by status.
  const { data: leads } = await supabase
    .from("leads")
    .select("id, owner_name, pharmacy_name, status, gps_lat, gps_lng, city, assigned_to, sales_profiles!leads_assigned_to_fkey(full_name)")
    .not("gps_lat", "is", null)
    .not("gps_lng", "is", null)
    .limit(2000);

  // Recent visits with coordinates — smaller dots, conductor's name in info.
  const { data: visits } = await supabase
    .from("lead_visits")
    .select("id, lead_id, check_in_lat, check_in_lng, check_in_at, sales_profiles(full_name)")
    .not("check_in_lat", "is", null)
    .not("check_in_lng", "is", null)
    .order("check_in_at", { ascending: false })
    .limit(500);

  const mapLeads: MapLead[] = (leads ?? []).map((l) => {
    const assignee = l.sales_profiles as unknown as { full_name: string } | null;
    return {
      id:           l.id,
      name:         (l.pharmacy_name as string | null) || (l.owner_name as string),
      status:       l.status as string,
      city:         l.city as string | null,
      lat:          l.gps_lat as number,
      lng:          l.gps_lng as number,
      assigned_to:  (l.assigned_to as string | null) ?? null,
      assignee:     assignee?.full_name ?? null,
    };
  });

  const mapVisits: MapVisit[] = (visits ?? []).map((v) => {
    const conductor = v.sales_profiles as unknown as { full_name: string } | null;
    return {
      id:          v.id as string,
      lead_id:     v.lead_id as string,
      lat:         v.check_in_lat as number,
      lng:         v.check_in_lng as number,
      at:          v.check_in_at as string,
      employee:    conductor?.full_name ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Map</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {mapLeads.length} pinned leads &nbsp;·&nbsp;
            {mapVisits.length} recent visits
          </p>
        </div>
      </div>

      {!apiKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-700">
          <strong className="block mb-1">Google Maps API key not configured.</strong>
          Set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code> and restart the dev server.
        </div>
      ) : (
        <MapClient apiKey={apiKey} leads={mapLeads} visits={mapVisits} />
      )}
    </div>
  );
}
