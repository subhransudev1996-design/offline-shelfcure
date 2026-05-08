import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage.from("installers").list("", {
      limit: 50,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const files = (data ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const { data: { publicUrl } } = supabase.storage.from("installers").getPublicUrl(f.name);
        return {
          name: f.name,
          size_mb: f.metadata?.size ? (f.metadata.size / 1024 / 1024).toFixed(1) : null,
          created_at: f.created_at,
          public_url: publicUrl,
        };
      });

    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
