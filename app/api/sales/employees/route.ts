import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";

// GET — active field_sales + demo_team employees. Used by the mobile app's
// "Conducted by" picker when scheduling a demo.
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sales_profiles")
    .select("id, full_name, role")
    .in("role", ["field_sales", "demo_team"])
    .eq("is_active", true)
    .order("full_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data ?? [] });
}
