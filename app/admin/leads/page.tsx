import { createServiceClient } from "@/lib/supabase/server";
import AddLeadModal from "./AddLeadModal";
import LeadsTable from "./LeadsTable";

export const dynamic = "force-dynamic";

const STATUS_CARDS = [
  { key: "new",         label: "New",        color: "text-slate-600",   bg: "bg-slate-100"   },
  { key: "contacted",   label: "Contacted",  color: "text-blue-600",    bg: "bg-blue-50"     },
  { key: "interested",  label: "Interested", color: "text-amber-700",   bg: "bg-amber-50"    },
  { key: "demo_done",   label: "Demo Done",  color: "text-purple-700",  bg: "bg-purple-50"   },
  { key: "negotiating", label: "Negotiating",color: "text-orange-600",  bg: "bg-orange-50"   },
  { key: "converted",   label: "Converted",  color: "text-emerald-700", bg: "bg-emerald-50"  },
  { key: "lost",        label: "Lost",       color: "text-red-500",     bg: "bg-red-50"      },
];

export default async function LeadsPage() {
  const supabase = createServiceClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, owner_name, pharmacy_name, phone, email, city, state, source,
      status, license_interest, notes, converted_license_key, created_at, updated_at,
      lead_followups(id, type, outcome, next_followup_date, created_at)
    `)
    .order("updated_at", { ascending: false });

  const all   = leads ?? [];
  const today = new Date().toISOString().split("T")[0];

  const counts = STATUS_CARDS.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = all.filter((l) => l.status === s.key).length;
    return acc;
  }, {});

  const todayFollowups = all.filter((l) =>
    l.lead_followups?.some((f: { next_followup_date: string | null }) => f.next_followup_date === today)
  ).length;

  const activeLeads = all.filter((l) => !["converted", "lost"].includes(l.status)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {all.length} total &nbsp;·&nbsp;
            <span className="text-slate-600 font-medium">{activeLeads} active</span>
            {todayFollowups > 0 && (
              <>
                &nbsp;·&nbsp;
                <span className="text-amber-600 font-semibold">{todayFollowups} follow-up{todayFollowups !== 1 ? "s" : ""} due today</span>
              </>
            )}
          </p>
        </div>
        <AddLeadModal />
      </div>

      {/* Pipeline status strip */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2.5">
        {STATUS_CARDS.map((s) => (
          <div key={s.key} className={`${s.bg} rounded-2xl p-3.5 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{counts[s.key] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Interactive table */}
      <LeadsTable leads={all as any} />
    </div>
  );
}
