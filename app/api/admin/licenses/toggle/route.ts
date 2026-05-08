import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, isActive } = await req.json();
    const supabase = createServiceClient();
    await supabase
      .from("desktop_licenses")
      .update({ status: isActive ? "active" : "suspended" })
      .eq("license_key", licenseKey);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
