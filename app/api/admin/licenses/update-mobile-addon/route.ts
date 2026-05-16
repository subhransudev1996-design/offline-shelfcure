import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey,
      mobileAddon,
      mobileAddonType,
      mobileAddonExpiry,
    }: {
      licenseKey: string;
      mobileAddon: boolean;
      mobileAddonType?: string | null;
      mobileAddonExpiry?: string | null;
    } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const update: Record<string, unknown> = {
      mobile_addon: mobileAddon,
      mobile_addon_type: mobileAddon ? (mobileAddonType ?? null) : null,
      mobile_addon_expiry: mobileAddon ? (mobileAddonExpiry ?? null) : null,
    };

    const { error } = await supabase
      .from("desktop_licenses")
      .update(update)
      .eq("license_key", licenseKey);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
