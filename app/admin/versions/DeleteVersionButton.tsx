"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  versionId: string;
  version: string;
  downloadUrl: string;
}

export default function DeleteVersionButton({ versionId, version, downloadUrl }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/versions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, downloadUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        setLoading(false);
        return;
      }
      setShowConfirm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-2 min-w-[220px] bg-red-50 border border-red-100 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 font-semibold leading-snug">
            Delete v{version}?<br />
            <span className="font-normal text-red-600">This removes the installer from Supabase Storage permanently.</span>
          </p>
        </div>
        {error && <p className="text-[11px] text-red-600 font-semibold">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
          <button
            onClick={() => { setShowConfirm(false); setError(""); }}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
      title={`Delete v${version} from storage`}
    >
      <Trash2 size={13} />
      Delete
    </button>
  );
}
