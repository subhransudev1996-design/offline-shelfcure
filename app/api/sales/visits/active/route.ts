import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";

// GET — the caller's currently-open visit, if any (else { visit: null }).
// Lets the app restore the check-out screen after a restart.
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lead_visits")
    .select("id, lead_id, check_in_at, leads(owner_name, pharmacy_name)")
    .eq("sales_user_id", auth.userId)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ visit: null });

  const lead = data.leads as unknown as { owner_name: string; pharmacy_name: string | null } | null;
  return NextResponse.json({
    visit: {
      id:          data.id,
      lead_id:     data.lead_id,
      check_in_at: data.check_in_at,
      lead_name:   lead?.pharmacy_name || lead?.owner_name || "Lead",
    },
  });
}
