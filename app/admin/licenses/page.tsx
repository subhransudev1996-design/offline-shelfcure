import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import LicenseActions from "./LicenseActions";
import CreateLicenseModal from "./CreateLicenseModal";

export const dynamic = "force-dynamic";

interface DesktopLicense {
  license_key: string;
  pharmacy_name: string;
  plan: string;
  license_type: "trial" | "yearly" | "lifetime";
  status: string;
  expiry_date?: string;
  max_machines: number;
  activated_machines: { machine_id: string; activated_at: string }[];
  updated_at: string;
}

const TYPE_STYLES = {
  trial:    { label: "Trial",    cls: "bg-orange-100 text-orange-600" },
  yearly:   { label: "1 Year",   cls: "bg-blue-100 text-blue-600"   },
  lifetime: { label: "Lifetime", cls: "bg-emerald-100 text-emerald-700" },
};

export default async function LicensesPage() {
  const supabase = createServiceClient();
  const { data: licenses } = await supabase
    .from("desktop_licenses")
    .select("license_key, pharmacy_name, plan, license_type, status, expiry_date, max_machines, activated_machines, updated_at")
    .order("updated_at", { ascending: false });

  const total     = licenses?.length ?? 0;
  const trials    = licenses?.filter((l) => l.license_type === "trial").length ?? 0;
  const yearly    = licenses?.filter((l) => l.license_type === "yearly").length ?? 0;
  const lifetime  = licenses?.filter((l) => l.license_type === "lifetime").length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Licenses</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {total} total &nbsp;·&nbsp;
            <span className="text-orange-500 font-medium">{trials} trial</span> &nbsp;·&nbsp;
            <span className="text-blue-500 font-medium">{yearly} yearly</span> &nbsp;·&nbsp;
            <span className="text-emerald-600 font-medium">{lifetime} lifetime</span>
          </p>
        </div>
        <CreateLicenseModal />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",    value: total,    cls: "text-slate-800"   },
          { label: "Trial",    value: trials,   cls: "text-orange-500" },
          { label: "1 Year",   value: yearly,   cls: "text-blue-500"   },
          { label: "Lifetime", value: lifetime, cls: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["License Key", "Pharmacy", "Type", "Status", "Machines", "Expiry", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!licenses?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No licenses yet</td>
                </tr>
              ) : (
                (licenses as DesktopLicense[]).map((lic) => {
                  const isActive       = lic.status === "active";
                  const activatedCount = Array.isArray(lic.activated_machines) ? lic.activated_machines.length : 0;
                  const typeStyle      = TYPE_STYLES[lic.license_type] ?? TYPE_STYLES.trial;

                  return (
                    <tr key={lic.license_key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-700 select-all">
                          {lic.license_key}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                        <Link
                          href={`/admin/licenses/${encodeURIComponent(lic.license_key)}`}
                          className="text-brand-navy hover:underline"
                        >
                          {lic.pharmacy_name || "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeStyle.cls}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {activatedCount} / {lic.max_machines}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {lic.expiry_date ? formatDate(lic.expiry_date) : "Lifetime"}
                      </td>
                      <td className="px-5 py-3.5">
                        <LicenseActions 
                          licenseKey={lic.license_key} 
                          isActive={isActive} 
                          pharmacyName={lic.pharmacy_name}
                        />
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
