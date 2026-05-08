import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, message, recipientPhone, imageBase64, imageType } = await req.json();

    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (!message?.trim() && !imageBase64) return NextResponse.json({ error: "Message or image required" }, { status: 400 });

    const supabase = createServiceClient();

    // Upload image if provided
    let imageUrl: string | null = null;
    if (imageBase64 && imageType) {
      const ext      = imageType.split("/")[1]?.split("+")[0] || "jpg";
      const fileName = `wa-${licenseKey.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.${ext}`;
      const buffer   = Buffer.from(imageBase64, "base64");

      const { error: upErr } = await supabase.storage
        .from("comms-images")
        .upload(fileName, buffer, { contentType: imageType, upsert: false });

      if (!upErr) {
        const { data: pub } = supabase.storage.from("comms-images").getPublicUrl(fileName);
        imageUrl = pub.publicUrl;
      }
    }

    await supabase.from("license_communications").insert({
      license_key: licenseKey,
      channel:     "whatsapp",
      message:     message?.trim() || "",
      image_url:   imageUrl,
      recipient:   recipientPhone?.trim() || null,
      status:      "sent",
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
