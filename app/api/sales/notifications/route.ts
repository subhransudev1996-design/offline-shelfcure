import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateSalesUser } from "@/lib/sales/auth";

// GET — the signed-in user's notifications, newest first.
// Response includes `unread` count for the home-screen badge.
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, lead_id, is_read, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.is_read).length;
  return NextResponse.json({ notifications, unread });
}

// PATCH — mark notifications read.
//   { id }      → mark one
//   { all: true } → mark all
export async function PATCH(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id, all } = await req.json();
    const supabase = createServiceClient();

    if (all === true) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", auth.userId)
        .eq("is_read", false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: "id or all required" }, { status: 400 });
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", auth.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
