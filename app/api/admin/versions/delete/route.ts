import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { versionId, downloadUrl } = await req.json();

    if (!versionId || !downloadUrl) {
      return NextResponse.json({ error: "Missing versionId or downloadUrl" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Guard: never delete the latest version
    const { data: ver } = await supabase
      .from("software_versions")
      .select("is_latest, version")
      .eq("id", versionId)
      .single();

    if (!ver) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    if (ver.is_latest) {
      return NextResponse.json({ error: "Cannot delete the active/latest version. Set another version as latest first." }, { status: 409 });
    }

    // Detect which bucket this file belongs to and extract the storage path.
    // Desktop:  .../storage/v1/object/public/installers/<filename>
    // Mobile:   .../storage/v1/object/public/mobile-apps/<filename>
    let bucket: string;
    let storagePath: string;

    const mobileMarker = "/mobile/";
    const desktopMarker = "/installers/";

    if (downloadUrl.includes(mobileMarker)) {
      bucket = "mobile";
      storagePath = downloadUrl.slice(downloadUrl.indexOf(mobileMarker) + mobileMarker.length);
    } else if (downloadUrl.includes(desktopMarker)) {
      bucket = "installers";
      storagePath = downloadUrl.slice(downloadUrl.indexOf(desktopMarker) + desktopMarker.length);
    } else {
      return NextResponse.json({ error: "Could not parse storage path from URL" }, { status: 400 });
    }

    // Delete from Supabase Storage first
    const { error: storageErr } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);

    if (storageErr) {
      // Log but continue — the file may already be gone; we still want to clean the DB row
      console.error("Storage delete error:", storageErr.message);
    }

    // Delete from DB
    const { error: dbErr } = await supabase
      .from("software_versions")
      .delete()
      .eq("id", versionId);

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedPath: storagePath });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
