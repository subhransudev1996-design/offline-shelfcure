import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";

// GET — leads visible to the signed-in mobile user.
//   field_sales / demo_team : only leads assigned to them.
//   admin                   : all leads.
// Each lead includes its follow-up history (most recent first).
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();

  let query = supabase
    .from("leads")
    .select(`
      id, owner_name, pharmacy_name, phone, whatsapp_number, email,
      address, city, state, source, status, license_interest, notes,
      priority_score, lost_reason, gps_lat, gps_lng,
      existing_software, monthly_billing_volume, staff_count,
      has_computer, has_internet, drug_license_no, gst_number,
      competitor_name, competitor_satisfaction, competitor_renewal_period,
      competitor_pain_points, assigned_to, converted_license_key,
      created_at, updated_at,
      lead_followups(id, lead_id, type, notes, outcome, next_followup_date, created_at),
      lead_demos(id, lead_id, conducted_by, scheduled_at, status, duration_minutes,
                 notes, questions_asked, interest_level, conversion_probability,
                 completed_at, created_at),
      lead_trials(id, lead_id, start_date, expiry_date, last_active_date,
                  login_count, conversion_probability, notes)
    `)
    .order("updated_at", { ascending: false });

  if (auth.profile.role !== "admin") {
    query = query.eq("assigned_to", auth.userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort each lead's follow-ups newest-first.
  const leads = (data ?? []).map((l) => ({
    ...l,
    lead_followups: [...(l.lead_followups ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  }));

  return NextResponse.json({ leads });
}
