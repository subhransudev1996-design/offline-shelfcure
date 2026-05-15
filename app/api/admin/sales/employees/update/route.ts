import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_ROLES = ["admin", "field_sales", "demo_team"];

// POST — update an existing sales employee (name / phone / role / active flag).
export async function POST(req: NextRequest) {
  try {
    const { id, full_name, phone, role, is_active } = await req.json();

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof full_name === "string" && full_name.trim()) update.full_name = full_name.trim();
    if (typeof phone === "string")                         update.phone = phone.trim() || null;
    if (typeof role === "string") {
      if (!VALID_ROLES.includes(role))
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      update.role = role;
    }
    if (typeof is_active === "boolean") update.is_active = is_active;

    const supabase = createServiceClient();
    const { error } = await supabase.from("sales_profiles").update(update).eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
