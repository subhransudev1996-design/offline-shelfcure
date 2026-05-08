import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { version, downloadUrl, fileSizeMb, releaseNotes } = await req.json();
    if (!version || !downloadUrl) {
      return NextResponse.json({ error: "Missing version or downloadUrl" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Clear is_latest from all existing rows
    await supabase.from("software_versions").update({ is_latest: false }).neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("software_versions").insert({
      version,
      download_url: downloadUrl,
      file_size_mb: fileSizeMb ?? null,
      release_notes: releaseNotes ?? null,
      is_latest: true,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
