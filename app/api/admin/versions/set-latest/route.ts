import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { versionId } = await req.json();
    const supabase = createServiceClient();

    // Get the platform of the version being promoted
    const { data: ver } = await supabase
      .from("software_versions")
      .select("platform")
      .eq("id", versionId)
      .single();

    const platform = ver?.platform ?? "windows";

    // Clear is_latest only within the same platform
    await supabase.from("software_versions")
      .update({ is_latest: false })
      .eq("platform", platform)
      .neq("id", versionId);

    await supabase.from("software_versions").update({ is_latest: true }).eq("id", versionId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
