import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface VisitRow {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  duration_seconds: number | null;
  distance_from_pin_m: number | null;
  within_radius: boolean | null;
  notes: string | null;
  leads: {
    id: string;
    owner_name: string;
    pharmacy_name: string | null;
    city: string | null;
  } | null;
  sales_profiles: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

function fmtDateTime(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function fmtDuration(s: number | null) {
  if (!s || s <= 0) return "—";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default async function SalesVisitsPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("lead_visits")
    .select(`
      id, check_in_at, check_out_at, duration_seconds,
      distance_from_pin_m, within_radius, notes,
      leads(id, owner_name, pharmacy_name, city),
      sales_profiles(id, full_name, role)
    `)
    .order("check_in_at", { ascending: false })
    .limit(200);

  const visits = (data ?? []) as unknown as VisitRow[];

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = visits.filter((v) => v.check_in_at.startsWith(today)).length;
  const openCount  = visits.filter((v) => v.check_out_at === null).length;

  // Employee leaderboard from the same dataset.
  const byEmp = new Map<string, { name: string; total: number; today: number }>();
  for (const v of visits) {
    const emp = v.sales_profiles;
    if (!emp) continue;
    const entry = byEmp.get(emp.id) ?? { name: emp.full_name, total: 0, today: 0 };
    entry.total += 1;
    if (v.check_in_at.startsWith(today)) entry.today += 1;
    byEmp.set(emp.id, entry);
  }
  const leaderboard = Array.from(byEmp.values())
    .sort((a, b) => b.today - a.today || b.total - a.total)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Field Visits</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {visits.length} recent visits &nbsp;·&nbsp;
          <span className="text-slate-600 font-medium">{todayCount} today</span>
          {openCount > 0 && (
            <>&nbsp;·&nbsp;
              <span className="text-amber-600 font-semibold">{openCount} open</span>
            </>
          )}
        </p>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Today&apos;s Top Performers</h3>
            <span className="text-xs text-slate-400">last 200 visits</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {leaderboard.map((e) => (
              <div key={e.name} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-500 truncate">{e.name}</div>
                <div className="text-xl font-bold text-brand-navy mt-0.5">{e.today}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">today · {e.total} total</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visits table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Employee", "Lead", "Check-in", "Check-out", "Duration", "Distance", "Notes"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!visits.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No visits logged yet</td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {v.sales_profiles?.full_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {v.leads ? (
                        <Link
                          href={`/admin/leads/${v.leads.id}`}
                          className="text-brand-navy hover:underline"
                        >
                          {v.leads.pharmacy_name || v.leads.owner_name}
                        </Link>
                      ) : "—"}
                      {v.leads?.city && (
                        <div className="text-xs text-slate-400">{v.leads.city}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {fmtDateTime(v.check_in_at)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {v.check_out_at ? (
                        <span className="text-slate-500">{fmtDateTime(v.check_out_at)}</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">OPEN</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                      {fmtDuration(v.duration_seconds)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {v.distance_from_pin_m == null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          v.within_radius === false
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {v.distance_from_pin_m} m
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="text-xs text-slate-600 truncate" title={v.notes ?? ""}>
                        {v.notes ?? <span className="text-slate-300">—</span>}
                      </div>
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
