import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { LEAD_STATUS_VALUES, LOST_REASON_VALUES } from "@/lib/leads/constants";

const VALID_SOURCES   = ["cold_call", "referral", "website", "facebook_ads", "google_ads", "exhibition", "walk_in", "other"];
const VALID_INTERESTS = ["trial", "yearly", "lifetime", "unsure"];

export async function POST(req: NextRequest) {
  try {
    const {
      id,
      owner_name,
      pharmacy_name,
      phone,
      email,
      address,
      city,
      state,
      source,
      status,
      license_interest,
      notes,
      lost_reason,
    } = await req.json();

    if (!id) return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    if (!pharmacy_name?.trim()) return NextResponse.json({ error: "Pharmacy name required" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    const supabase = createServiceClient();

    const update: Record<string, unknown> = {
      owner_name:       owner_name.trim(),
      pharmacy_name:    pharmacy_name?.trim() || null,
      phone:            phone?.trim() || null,
      email:            email?.trim() || null,
      address:          address?.trim() || null,
      city:             city?.trim() || null,
      state:            state?.trim() || null,
      source:           VALID_SOURCES.includes(source) ? source : "cold_call",
      status:           LEAD_STATUS_VALUES.includes(status) ? status : "new",
      license_interest: VALID_INTERESTS.includes(license_interest) ? license_interest : null,
      notes:            notes?.trim() || null,
      updated_at:       new Date().toISOString(),
    };

    // Only touch lost_reason when the caller explicitly sends it, so
    // existing callers that omit the field never wipe a stored reason.
    if (lost_reason !== undefined) {
      update.lost_reason = LOST_REASON_VALUES.includes(lost_reason) ? lost_reason : null;
    }

    const { error } = await supabase
      .from("leads")
      .update(update)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
