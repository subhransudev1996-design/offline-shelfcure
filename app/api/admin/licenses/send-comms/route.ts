import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildEmailHtml, type TemplateId } from "@/lib/comms-templates";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const {
      licenseKey,
      templateId,
      subject,
      message,
      imageBase64,
      imageType,
      recipientEmail,
    }: {
      licenseKey:     string;
      templateId?:    TemplateId;
      subject?:       string;
      message:        string;
      imageBase64?:   string;
      imageType?:     string;
      recipientEmail: string;
    } = await req.json();

    if (!licenseKey)             return NextResponse.json({ error: "Missing licenseKey" },        { status: 400 });
    if (!message?.trim())        return NextResponse.json({ error: "Message is required" },       { status: 400 });
    if (!recipientEmail?.trim()) return NextResponse.json({ error: "Recipient email required" },  { status: 400 });

    const supabase = createServiceClient();

    // Fetch pharmacy name for personalisation
    const { data: lic } = await supabase
      .from("desktop_licenses")
      .select("pharmacy_name")
      .eq("license_key", licenseKey)
      .single();
    const pharmacyName = lic?.pharmacy_name ?? "Valued Customer";

    // Upload image to Supabase storage if provided
    let imageUrl: string | null = null;
    if (imageBase64 && imageType) {
      const ext      = imageType.split("/")[1]?.split("+")[0] || "jpg";
      const fileName = `${licenseKey.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.${ext}`;
      const buffer   = Buffer.from(imageBase64, "base64");

      const { error: upErr } = await supabase.storage
        .from("comms-images")
        .upload(fileName, buffer, { contentType: imageType, upsert: false });

      if (!upErr) {
        const { data: pub } = supabase.storage.from("comms-images").getPublicUrl(fileName);
        imageUrl = pub.publicUrl;
      }
    }

    // Build HTML using the selected template
    const html = buildEmailHtml(templateId ?? "plain", {
      pharmacyName,
      subject: subject?.trim() || null,
      message: message.trim(),
      imageUrl,
    });

    // Load logo for CID attachment
    const attachments: { filename: string; content: Buffer; contentId: string }[] = [];
    try {
      const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
      attachments.push({ filename: "logo.png", content: logoBuffer, contentId: "logo" });
    } catch {
      // logo not found — emails still send, just without the logo image
    }

    // Send via Resend
    const { data: mailData, error: mailError } = await resend.emails.send({
      from:        `ShelfCure <${process.env.EMAIL_FROM ?? "info@shelfcure.com"}>`,
      to:          recipientEmail.trim(),
      subject:     subject?.trim() || "A message from ShelfCure",
      html,
      attachments,
    });

    if (mailError) {
      console.error("[send-comms] Resend error:", mailError);
    } else {
      console.log("[send-comms] Email sent, id:", mailData?.id);
    }

    const status = mailError ? "failed" : "sent";

    // Log the attempt (non-blocking — ignore DB errors)
    const { error: dbErr } = await supabase.from("license_communications").insert({
      license_key:  licenseKey,
      channel:      "email",
      template_id:  templateId ?? "plain",
      subject:      subject?.trim() || null,
      message:      message.trim(),
      image_url:    imageUrl,
      recipient:    recipientEmail.trim(),
      status,
    });
    if (dbErr) console.error("[send-comms] DB log error:", dbErr.message);

    if (mailError) {
      return NextResponse.json(
        { error: `${mailError.name}: ${mailError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-comms] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
