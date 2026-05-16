import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "mobile";
const SIZE_LIMIT = 500 * 1024 * 1024; // 500 MB

export async function POST() {
  try {
    const supabase = createServiceClient();

    // Try to create the bucket
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: SIZE_LIMIT,
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase() ?? "";
      if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("unique")) {
        // Bucket already exists — try to update the size limit
        const { error: updateErr } = await supabase.storage.updateBucket(BUCKET, {
          public: true,
          fileSizeLimit: SIZE_LIMIT,
        });
        // Ignore update errors — the bucket exists and that's what matters
        if (updateErr) {
          console.warn("[setup-mobile-bucket] updateBucket warning:", updateErr.message);
        }
      } else {
        // Non-duplicate error — log it but still return success so the form shows
        console.warn("[setup-mobile-bucket] createBucket warning:", createErr.message);
        return NextResponse.json({
          success: true,
          warning: createErr.message,
          bucket: BUCKET,
        });
      }
    }

    return NextResponse.json({ success: true, bucket: BUCKET, sizeLimitMb: SIZE_LIMIT / 1024 / 1024 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
