"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HardDrive, Link2, CheckCircle } from "lucide-react";

interface StorageFile {
  name: string;
  size_mb: string | null;
  created_at: string | null;
  public_url: string;
}

export default function StorageFilesPanel() {
  const router = useRouter();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linking, setLinking] = useState<string | null>(null);
  const [linked, setLinked] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/versions/storage-files")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setFiles(d.files ?? []);
      })
      .catch(() => setError("Failed to load storage files"))
      .finally(() => setLoading(false));
  }, []);

  async function useAsLatest(file: StorageFile) {
    const version = prompt(
      `Set version number for:\n${file.name}`,
      file.name.match(/v([\d.]+)/)?.[1] ?? ""
    );
    if (!version) return;

    setLinking(file.public_url);
    const res = await fetch("/api/admin/versions/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version,
        downloadUrl: file.public_url,
        fileSizeMb: file.size_mb ? parseFloat(file.size_mb) : null,
      }),
    });
    if (res.ok) {
      setLinked(file.public_url);
      router.refresh();
      setTimeout(() => setLinked(null), 3000);
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed");
    }
    setLinking(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive size={16} className="text-slate-400" />
        <h2 className="text-sm font-bold text-slate-900">Files in Supabase Storage</h2>
        <span className="text-xs text-slate-400 ml-1">(installers bucket)</span>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && files.length === 0 && (
        <p className="text-sm text-slate-400">No files found in the installers bucket.</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.public_url}
              className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">{f.public_url}</p>
                {f.size_mb && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{f.size_mb} MB</p>
                )}
              </div>
              <button
                onClick={() => useAsLatest(f)}
                disabled={!!linking}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-navy text-white hover:opacity-90 transition-all disabled:opacity-50"
              >
                {linked === f.public_url ? (
                  <><CheckCircle size={13} /> Done</>
                ) : linking === f.public_url ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Link2 size={13} /> Use as Latest</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
