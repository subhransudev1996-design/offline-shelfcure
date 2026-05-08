import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface TrialLicense {
  license_key: string;
  pharmacy_name: string;
  plan: string;
  status: string;
  expiry_date: string;
  activated_machines: { machine_id: string; activated_at: string }[];
  created_at?: string;
}

export default async function TrialsPage() {
  const supabase = createServiceClient();

  const { data: trials } = await supabase
    .from("desktop_licenses")
    .select("license_key, pharmacy_name, plan, license_type, status, expiry_date, activated_machines, created_at")
    .eq("license_type", "trial")
    .order("expiry_date", { ascending: false });

  const now = new Date();
  const total = trials?.length ?? 0;
  const active = trials?.filter((t) => new Date(t.expiry_date) > now).length ?? 0;
  const expired = total - active;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Trial Licenses</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {total} total · {active} active · {expired} expired
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Trials", value: total, color: "text-brand-cyan" },
          { label: "Currently Active", value: active, color: "text-brand-emerald" },
          { label: "Expired", value: expired, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["License Key", "Pharmacy", "Plan", "Machines Activated", "Expiry Date", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!trials?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No trial licenses found</td>
                </tr>
              ) : (
                (trials as TrialLicense[]).map((t) => {
                  const isExpired = new Date(t.expiry_date) < now;
                  const activatedCount = Array.isArray(t.activated_machines) ? t.activated_machines.length : 0;
                  const daysLeft = Math.ceil((new Date(t.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={t.license_key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-700 select-all">
                          {t.license_key}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                        <Link
                          href={`/admin/licenses/${encodeURIComponent(t.license_key)}`}
                          className="text-brand-navy hover:underline"
                        >
                          {t.pharmacy_name || "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 capitalize">
                          {t.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {activatedCount} machine{activatedCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(t.expiry_date)}
                        {!isExpired && (
                          <span className="ml-2 text-brand-emerald font-medium">
                            ({daysLeft}d left)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isExpired
                            ? "bg-red-100 text-red-600"
                            : t.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {isExpired ? "Expired" : t.status === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
