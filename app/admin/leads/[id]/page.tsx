import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LeadDetailClient from "./LeadDetailClient";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(`
      id, owner_name, pharmacy_name, phone, email, address, city, state,
      source, status, license_interest, notes, converted_license_key, assigned_to,
      created_at, updated_at,
      lead_followups(id, lead_id, type, notes, outcome, next_followup_date, created_at)
    `)
    .eq("id", id)
    .single();

  if (error || !lead) notFound();

  // Active field-sales / demo-team employees, for the assignment dropdown.
  const { data: employees } = await supabase
    .from("sales_profiles")
    .select("id, full_name, role")
    .in("role", ["field_sales", "demo_team"])
    .eq("is_active", true)
    .order("full_name");

  const followups = [...(lead.lead_followups ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <LeadDetailClient
      lead={{ ...lead, lead_followups: followups } as any}
      employees={employees ?? []}
    />
  );
}
