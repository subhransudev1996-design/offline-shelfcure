import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordEvent, pushNotification } from "@/lib/leads/events";

// POST — assign (or unassign) a lead to a sales employee.
// Body: { lead_id, assigned_to }  — assigned_to = null clears the assignment.
export async function POST(req: NextRequest) {
  try {
    const { lead_id, assigned_to } = await req.json();

    if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

    const supabase = createServiceClient();

    // If an employee id is given, confirm it exists and is an active
    // field-sales / demo-team member before assigning.
    if (assigned_to) {
      const { data: emp } = await supabase
        .from("sales_profiles")
        .select("id, is_active")
        .eq("id", assigned_to)
        .maybeSingle();
      if (!emp)            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      if (!emp.is_active)  return NextResponse.json({ error: "Employee is deactivated" }, { status: 400 });
    }

    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: assigned_to || null, updated_at: new Date().toISOString() })
      .eq("id", lead_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Timeline + notification for the new assignee.
    await recordEvent(supabase, {
      leadId: lead_id,
      actorId: null, // admin action — no sales actor
      eventType: "assigned",
      payload: { assigned_to: assigned_to || null },
    });
    if (assigned_to) {
      const { data: lead } = await supabase
        .from("leads")
        .select("owner_name, pharmacy_name")
        .eq("id", lead_id)
        .maybeSingle();
      const label = lead?.pharmacy_name || lead?.owner_name || "a lead";
      await pushNotification(supabase, {
        userId: assigned_to,
        kind:   "lead_assigned",
        title:  "New lead assigned to you",
        body:   label,
        leadId: lead_id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
