import { createServiceClient } from "@/lib/supabase/server";
import CreateLicenseModal from "./CreateLicenseModal";
import LicensesTable from "./LicensesTable";

export const dynamic = "force-dynamic";

export interface DesktopLicense {
  license_key: string;
  pharmacy_name: string;
  plan: string;
  license_type: "trial" | "yearly" | "lifetime";
  status: string;
  expiry_date?: string;
  max_machines: number;
  activated_machines: { machine_id: string; activated_at: string }[];
  updated_at: string;
  created_at?: string;
  owner_email?: string;
  mobile_addon?: boolean;
  is_test?: boolean;
}

export default async function LicensesPage() {
  const supabase = createServiceClient();
  const { data: licenses } = await supabase
    .from("desktop_licenses")
    .select("license_key, pharmacy_name, plan, license_type, status, expiry_date, max_machines, activated_machines, updated_at, created_at, owner_email, mobile_addon, is_test")
    .order("created_at", { ascending: false });

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

      <LicensesTable licenses={(licenses as DesktopLicense[]) ?? []} />
    </div>
  );
}
