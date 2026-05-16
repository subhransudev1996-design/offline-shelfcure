"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, Smartphone, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "mobile";
const MAX_MB = 500;

export default function MobileUploadForm() {
  const router = useRouter();
  const [form, setForm] = useState({ version: "", releaseNotes: "", fileSizeMb: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [bucketReady, setBucketReady] = useState(false);
  const [bucketWarning, setBucketWarning] = useState("");

  // Ensure the mobile-apps bucket exists with a 500 MB file size limit
  useEffect(() => {
    fetch("/api/admin/versions/setup-mobile-bucket", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        // Show the form regardless — even a warning response means the bucket exists
        setBucketReady(true);
        if (d.warning) setBucketWarning(d.warning);
      })
      .catch(() => {
        // Network error — still show the form, user can try uploading
        setBucketReady(true);
        setBucketWarning("Could not verify storage bucket setup. Upload may still work if the bucket already exists.");
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !form.version) {
      setError("Version number and APK file are required");
      return;
    }
    if (!bucketReady) {
      setError("Storage is still initialising — please wait a moment and try again");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const fileName = `ShelfCure_Scanner_v${form.version}.apk`;

      // Step 1: get a signed upload URL from server (uses service role — bypasses RLS)
      const urlRes = await fetch("/api/admin/versions/signed-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, bucket: BUCKET }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error ?? "Failed to get upload URL");

      // Step 2: upload directly to Supabase using the signed URL (no RLS involved)
      const supabase = createClient();
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(urlData.path, urlData.token, file, { upsert: true });

      if (uploadErr) throw new Error(uploadErr.message);

      const publicUrl: string = urlData.publicUrl;

      const res = await fetch("/api/admin/versions/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: form.version,
          downloadUrl: publicUrl,
          fileSizeMb: form.fileSizeMb ? parseFloat(form.fileSizeMb) : null,
          releaseNotes: form.releaseNotes || null,
          platform: "android",
        }),
      });

      if (!res.ok) {
        const { error: dbErr } = await res.json();
        throw new Error(dbErr ?? "Database insert failed");
      }

      setDone(true);
      setForm({ version: "", releaseNotes: "", fileSizeMb: "" });
      setFile(null);
      router.refresh();
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!bucketReady && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-slate-300 border-t-brand-navy rounded-full animate-spin inline-block" />
          Initialising storage…
        </p>
      )}
      {bucketWarning && bucketReady && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{bucketWarning}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Version Number *</label>
          <input
            type="text"
            required
            placeholder="e.g. 1.0.3"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy outline-none text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">File Size (MB)</label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 24.5"
            value={form.fileSizeMb}
            onChange={(e) => setForm({ ...form, fileSizeMb: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Release Notes</label>
        <textarea
          rows={2}
          placeholder="What's new in this version..."
          value={form.releaseNotes}
          onChange={(e) => setForm({ ...form, releaseNotes: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy outline-none text-sm resize-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">APK File (.apk) *</label>
        <label className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-navy cursor-pointer transition-all">
          <Smartphone size={16} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-500 truncate">
            {file
              ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
              : "Click to select Android APK file"}
          </span>
          <input
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <p className="text-[11px] text-slate-400 mt-1">Maximum 500 MB · APK stored in the <code className="font-mono">mobile</code> bucket</p>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={uploading || !bucketReady}
        className="flex items-center gap-2 px-6 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-xl hover:bg-brand-navy-light transition-all disabled:opacity-60"
      >
        {done ? (
          <><CheckCircle size={15} /> Uploaded & Set as Latest</>
        ) : uploading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
        ) : (
          <><Upload size={15} /> Upload & Set as Latest</>
        )}
      </button>
    </form>
  );
}
