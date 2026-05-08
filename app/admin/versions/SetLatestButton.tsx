"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetLatestButton({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await fetch("/api/admin/versions/set-latest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs font-semibold text-brand-navy hover:underline disabled:opacity-50"
    >
      {loading ? "Setting…" : "Set as Latest"}
    </button>
  );
}
