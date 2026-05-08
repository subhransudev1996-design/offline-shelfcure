import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_SOURCES   = ["cold_call", "referral", "website", "facebook_ads", "google_ads", "exhibition", "walk_in", "other"];
const VALID_INTERESTS = ["trial", "yearly", "lifetime", "unsure"];

export async function POST(req: NextRequest) {
  try {
    const {
      owner_name,
      pharmacy_name,
      phone,
      email,
      address,
      city,
      state,
      source,
      license_interest,
      notes,
    } = await req.json();

    if (!pharmacy_name?.trim()) {
      return NextResponse.json({ error: "Pharmacy name is required" }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("leads")
      .insert({
        owner_name:       owner_name.trim(),
        pharmacy_name:    pharmacy_name?.trim() || null,
        phone:            phone?.trim() || null,
        email:            email?.trim() || null,
        address:          address?.trim() || null,
        city:             city?.trim() || null,
        state:            state?.trim() || null,
        source:           VALID_SOURCES.includes(source) ? source : "cold_call",
        license_interest: VALID_INTERESTS.includes(license_interest) ? license_interest : null,
        notes:            notes?.trim() || null,
        status:           "new",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
