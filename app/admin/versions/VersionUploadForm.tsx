"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; // still needed for storage upload
export default function VersionUploadForm() {
  const router = useRouter();
  const [form, setForm] = useState({ version: "", releaseNotes: "", fileSizeMb: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !form.version) {
      setError("Version number and file are required");
      return;
    }
    setUploading(true);
    setError("");

    try {
      const supabase = createClient();
      const fileName = `ShelfCure_v${form.version}_setup.exe`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("installers")
        .upload(fileName, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("installers").getPublicUrl(uploadData.path);

      // Use server route (service role) so RLS never blocks the DB insert
      const res = await fetch("/api/admin/versions/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: form.version,
          downloadUrl: publicUrl,
          fileSizeMb: form.fileSizeMb ? parseFloat(form.fileSizeMb) : null,
          releaseNotes: form.releaseNotes || null,
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
            placeholder="e.g. 85.4"
            value={form.fileSizeMb}
            onChange={(e) => setForm({ ...form, fileSizeMb: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Release Notes</label>
        <textarea
          rows={3}
          placeholder="What's new in this version..."
          value={form.releaseNotes}
          onChange={(e) => setForm({ ...form, releaseNotes: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy outline-none text-sm resize-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Installer File (.exe) *</label>
        <label className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-navy cursor-pointer transition-all">
          <Upload size={16} className="text-slate-400" />
          <span className="text-sm text-slate-500">
            {file ? file.name : "Click to select installer .exe file"}
          </span>
          <input
            type="file"
            accept=".exe"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="flex items-center gap-2 px-6 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-xl hover:bg-brand-navy-light transition-all disabled:opacity-60"
      >
        {done ? (
          <><CheckCircle size={15} /> Uploaded & Set as Latest</>
        ) : uploading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
        ) : (
          <><Upload size={15} /> Upload & Set as Latest</>
        )}
      </button>
    </form>
  );
}
