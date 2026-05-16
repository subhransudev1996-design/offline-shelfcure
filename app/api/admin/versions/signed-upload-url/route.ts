import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { fileName, bucket } = await req.json();
    if (!fileName || !bucket) {
      return NextResponse.json({ error: "Missing fileName or bucket" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Create a signed URL the browser can use to upload directly — bypasses bucket RLS
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(fileName, { upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get the public URL the file will be accessible at after upload
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path, publicUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
