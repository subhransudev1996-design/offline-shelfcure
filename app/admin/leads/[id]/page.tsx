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
      source, status, license_interest, notes, converted_license_key, created_at, updated_at,
      lead_followups(id, lead_id, type, notes, outcome, next_followup_date, created_at)
    `)
    .eq("id", id)
    .single();

  if (error || !lead) notFound();

  const followups = [...(lead.lead_followups ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return <LeadDetailClient lead={{ ...lead, lead_followups: followups } as any} />;
}
