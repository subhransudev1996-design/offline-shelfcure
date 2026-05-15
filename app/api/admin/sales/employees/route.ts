import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_ROLES = ["admin", "field_sales", "demo_team"];

// GET — list all sales employees (admin panel).
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sales_profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data ?? [] });
}

// POST — create a Supabase Auth user + their sales_profiles row.
export async function POST(req: NextRequest) {
  try {
    const { full_name, email, password, phone, role } = await req.json();

    if (!full_name?.trim()) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    if (!email?.trim())     return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    if (!VALID_ROLES.includes(role))
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    const supabase = createServiceClient();
    const cleanEmail = email.trim().toLowerCase();

    // Create the auth user (email pre-confirmed — no verification email).
    const { data: created, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
    });
    if (authErr || !created?.user)
      return NextResponse.json({ error: authErr?.message || "Could not create user" }, { status: 400 });

    const { error: profileErr } = await supabase.from("sales_profiles").insert({
      id:        created.user.id,
      full_name: full_name.trim(),
      email:     cleanEmail,
      phone:     phone?.trim() || null,
      role,
    });

    // Roll back the orphaned auth user if the profile insert fails.
    if (profileErr) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: created.user.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
