import { createServiceClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import VersionUploadForm from "./VersionUploadForm";
import SetLatestButton from "./SetLatestButton";
import type { SoftwareVersion } from "@/types";

export const dynamic = "force-dynamic";

export default async function VersionsPage() {
  const supabase = createServiceClient();
  const { data: versions } = await supabase
    .from("software_versions")
    .select("*")
    .order("released_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Software Versions</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage installer uploads and the active download link</p>
      </div>

      {/* Upload new version */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Upload New Version</h2>
        <VersionUploadForm />
      </div>

      {/* Versions list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Version", "Released", "File Size", "Download URL", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!versions?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No versions uploaded yet</td>
                </tr>
              ) : (
                versions.map((v: SoftwareVersion) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">v{v.version}</span>
                        {v.is_latest && (
                          <span className="bg-brand-emerald/10 text-brand-emerald text-[10px] font-bold px-2 py-0.5 rounded-full">
                            LATEST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {formatDateTime(v.released_at)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {v.file_size_mb ? `${v.file_size_mb} MB` : "—"}
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px] truncate">
                      <a
                        href={v.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-navy hover:underline text-xs font-mono"
                      >
                        {v.download_url.slice(0, 40)}…
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${v.is_latest ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {v.is_latest ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {!v.is_latest && <SetLatestButton versionId={v.id} />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
