import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { versionId } = await req.json();
    const supabase = createServiceClient();
    await supabase.from("software_versions").update({ is_latest: false }).neq("id", versionId);
    await supabase.from("software_versions").update({ is_latest: true }).eq("id", versionId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
