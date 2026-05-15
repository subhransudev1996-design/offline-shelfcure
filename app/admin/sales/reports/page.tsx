import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { LEAD_STATUSES } from "@/lib/leads/constants";
import PipelineChart, { type PipelineBucket } from "./PipelineChart";

export const dynamic = "force-dynamic";

const PIPELINE_COLORS: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#3b82f6",
  followup_pending: "#0284c7",
  call_not_picked: "#a1a1aa",
  interested: "#f59e0b",
  visit_planned: "#0d9488",
  demo_scheduled: "#6366f1",
  demo_done: "#9333ea",
  trial_activated: "#06b6d4",
  negotiating: "#f97316",
  payment_pending: "#ca8a04",
  future_opportunity: "#a8a29e",
  converted: "#10b981",
  lost: "#ef4444",
};

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default async function SalesReportsPage() {
  const supabase = createServiceClient();

  // Fan out the queries we need.
  const [
    { data: leads },
    { data: demos },
    { data: trials },
    { data: visits },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, status, source, lost_reason, assigned_to, city, created_at, updated_at, converted_license_key")
      .limit(5000),
    supabase
      .from("lead_demos")
      .select("id, lead_id, status, conducted_by"),
    supabase
      .from("lead_trials")
      .select("id, lead_id, expiry_date"),
    supabase
      .from("lead_visits")
      .select("id, sales_user_id, check_in_at, check_out_at, duration_seconds"),
  ]);

  const allLeads  = leads  ?? [];
  const allDemos  = demos  ?? [];
  const allTrials = trials ?? [];
  const allVisits = visits ?? [];

  // ── KPIs ──────────────────────────────────────────────────────────────
  const total      = allLeads.length;
  const converted  = allLeads.filter((l) => l.status === "converted").length;
  const lost       = allLeads.filter((l) => l.status === "lost").length;
  const active     = total - converted - lost;
  const today      = new Date().toISOString().slice(0, 10);
  const todayLeads = allLeads.filter((l) => l.created_at?.startsWith(today)).length;

  const completedDemos  = allDemos.filter((d) => d.status === "completed").length;
  const demoConverted   = allDemos.filter((d) => d.status === "completed"
    && allLeads.find((l) => l.id === d.lead_id)?.status === "converted").length;
  const trialConverted  = allTrials.filter((t) =>
    allLeads.find((l) => l.id === t.lead_id)?.status === "converted").length;
  const todayVisits     = allVisits.filter((v) => v.check_in_at.startsWith(today)).length;

  // Avg conversion cycle in days.
  const cycles = allLeads
    .filter((l) => l.status === "converted")
    .map((l) =>
      (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 86_400_000
    )
    .filter((d) => isFinite(d) && d >= 0);
  const avgCycle = cycles.length
    ? (cycles.reduce((s, d) => s + d, 0) / cycles.length).toFixed(1)
    : "—";

  // ── Pipeline (bar chart) ──────────────────────────────────────────────
  const pipeline: PipelineBucket[] = LEAD_STATUSES.map((s) => ({
    label: s.label,
    count: allLeads.filter((l) => l.status === s.value).length,
    color: PIPELINE_COLORS[s.value] ?? "#94a3b8",
  })).filter((b) => b.count > 0);

  // ── Source breakdown ──────────────────────────────────────────────────
  const bySource = new Map<string, number>();
  for (const l of allLeads) bySource.set(l.source, (bySource.get(l.source) ?? 0) + 1);
  const sources = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // ── Lost reasons ──────────────────────────────────────────────────────
  const byReason = new Map<string, number>();
  for (const l of allLeads.filter((l) => l.status === "lost")) {
    byReason.set(l.lost_reason ?? "not_specified",
      (byReason.get(l.lost_reason ?? "not_specified") ?? 0) + 1);
  }
  const reasons = Array.from(byReason.entries()).sort((a, b) => b[1] - a[1]);

  // ── Area-wise ─────────────────────────────────────────────────────────
  const byCity = new Map<string, { total: number; converted: number }>();
  for (const l of allLeads) {
    if (!l.city) continue;
    const e = byCity.get(l.city) ?? { total: 0, converted: 0 };
    e.total += 1;
    if (l.status === "converted") e.converted += 1;
    byCity.set(l.city, e);
  }
  const cities = Array.from(byCity.entries())
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  // ── Employee leaderboard ──────────────────────────────────────────────
  const { data: employees } = await supabase
    .from("sales_profiles")
    .select("id, full_name, role")
    .eq("is_active", true);
  const byEmp = new Map<string, {
    name: string; role: string; assigned: number; converted: number; visits: number; demos: number;
  }>();
  for (const e of employees ?? []) {
    byEmp.set(e.id, { name: e.full_name, role: e.role, assigned: 0, converted: 0, visits: 0, demos: 0 });
  }
  for (const l of allLeads) {
    if (!l.assigned_to) continue;
    const e = byEmp.get(l.assigned_to);
    if (!e) continue;
    e.assigned += 1;
    if (l.status === "converted") e.converted += 1;
  }
  for (const v of allVisits) {
    const e = byEmp.get(v.sales_user_id);
    if (e) e.visits += 1;
  }
  for (const d of allDemos) {
    if (!d.conducted_by) continue;
    const e = byEmp.get(d.conducted_by);
    if (e) e.demos += 1;
  }
  const leaderboard = Array.from(byEmp.values())
    .filter((e) => e.assigned + e.visits + e.demos > 0)
    .sort((a, b) => b.converted - a.converted || b.visits - a.visits)
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sales Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {total} leads · {todayLeads} added today · {todayVisits} visits today
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: "Total Leads",     value: total.toString(),                 color: "text-slate-700" },
          { label: "Active",          value: active.toString(),                color: "text-blue-600"  },
          { label: "Converted",       value: converted.toString(),             color: "text-emerald-600" },
          { label: "Conversion %",    value: pct(converted, total),            color: "text-emerald-700" },
          { label: "Demo → Convert",  value: pct(demoConverted, completedDemos), color: "text-purple-700" },
          { label: "Trial → Convert", value: pct(trialConverted, allTrials.length), color: "text-cyan-700" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Lost",             value: lost.toString() },
          { label: "Completed Demos",  value: completedDemos.toString() },
          { label: "Active Trials",    value: allTrials.length.toString() },
          { label: "Avg Days to Convert", value: typeof avgCycle === "string" ? avgCycle : avgCycle },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xl font-bold text-slate-800">{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Lead Pipeline</h3>
        {pipeline.length === 0 ? (
          <p className="text-sm text-slate-400 py-12 text-center">No leads yet</p>
        ) : (
          <PipelineChart data={pipeline} />
        )}
      </div>

      {/* Employee leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Employee Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Employee", "Role", "Assigned", "Converted", "Visits", "Demos", "Conv %"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">No employee activity yet</td>
                </tr>
              ) : (
                leaderboard.map((e) => (
                  <tr key={e.name} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">{e.name}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {e.role === "demo_team" ? "Demo" : "Field"}
                    </td>
                    <td className="px-5 py-3">{e.assigned}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-700">{e.converted}</td>
                    <td className="px-5 py-3">{e.visits}</td>
                    <td className="px-5 py-3">{e.demos}</td>
                    <td className="px-5 py-3 text-emerald-700">{pct(e.converted, e.assigned)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-up: sources + lost reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Top Lead Sources</h3>
          {sources.length === 0 ? (
            <p className="text-sm text-slate-400">No data</p>
          ) : (
            <div className="space-y-2">
              {sources.map(([k, c]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{k.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-slate-900">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Lost-Lead Reasons</h3>
          {reasons.length === 0 ? (
            <p className="text-sm text-slate-400">No lost leads</p>
          ) : (
            <div className="space-y-2">
              {reasons.map(([k, c]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{k.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-red-500">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Area performance */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Top Cities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["City", "Leads", "Converted", "Conv %"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">No cities with 2+ leads yet</td>
                </tr>
              ) : (
                cities.map(([city, v]) => (
                  <tr key={city} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900">{city}</td>
                    <td className="px-5 py-3">{v.total}</td>
                    <td className="px-5 py-3 text-emerald-700 font-semibold">{v.converted}</td>
                    <td className="px-5 py-3 text-emerald-700">{pct(v.converted, v.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Reports cover up to the most recent 5,000 leads. For deeper analysis use{" "}
        <Link href="/admin/leads" className="underline">/admin/leads</Link>.
      </p>
    </div>
  );
}
