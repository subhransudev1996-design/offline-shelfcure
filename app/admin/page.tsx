import { createServiceClient } from "@/lib/supabase/server";
import { IndianRupee, Key, Clock, AlertTriangle, TrendingUp, TrendingDown, CalendarCheck, Users, UserPlus, PhoneCall } from "lucide-react";
import Link from "next/link";
import RevenueChart from "@/components/admin/RevenueChart";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000)   return "₹" + (n / 1000).toFixed(1) + "k";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
function fmtFull(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function getStats() {
  const supabase = createServiceClient();

  const [
    { data: installments },
    { data: licenses },
    { data: payments },
    { data: leads },
  ] = await Promise.all([
    supabase
      .from("license_payment_installments")
      .select("amount, paid_date, due_date, license_key"),
    supabase
      .from("desktop_licenses")
      .select("license_key, pharmacy_name, license_type, status, expiry_date, created_at, is_test"),
    supabase
      .from("license_payments")
      .select("id, license_key, total_amount, created_at"),
    supabase
      .from("leads")
      .select("id, owner_name, pharmacy_name, status, created_at, lead_followups(next_followup_date)"),
  ]);

  const now   = new Date();
  const today = now.toISOString().split("T")[0];

  // ── Revenue metrics ────────────────────────────────────────────────
  // Test licenses are excluded from all revenue figures.
  const testKeys = new Set(
    (licenses ?? []).filter((l) => (l as any).is_test).map((l) => l.license_key)
  );
  const allInstallments = (installments ?? []).filter((i) => !testKeys.has(i.license_key));
  const paid    = allInstallments.filter((i) => !!i.paid_date);
  const unpaid  = allInstallments.filter((i) => !i.paid_date);
  const overdue = unpaid.filter((i) => i.due_date && i.due_date < today);

  const totalCollected = paid.reduce((s, i) => s + i.amount, 0);
  const totalPending   = unpaid.reduce((s, i) => s + i.amount, 0);
  const totalOverdue   = overdue.reduce((s, i) => s + i.amount, 0);

  // This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const thisMonthCollected = paid
    .filter((i) => i.paid_date && i.paid_date >= monthStart)
    .reduce((s, i) => s + i.amount, 0);

  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
  const lastMonthCollected = paid
    .filter((i) => i.paid_date && i.paid_date >= lastMonthStart && i.paid_date <= lastMonthEnd)
    .reduce((s, i) => s + i.amount, 0);

  const monthGrowth = lastMonthCollected > 0
    ? Math.round(((thisMonthCollected - lastMonthCollected) / lastMonthCollected) * 100)
    : null;

  // ── License metrics ────────────────────────────────────────────────
  const allLicenses = licenses ?? [];
  const activeLicenses  = allLicenses.filter((l) => l.status === "active").length;
  const trialCount      = allLicenses.filter((l) => l.license_type === "trial").length;
  const yearlyCount     = allLicenses.filter((l) => l.license_type === "yearly").length;
  const lifetimeCount   = allLicenses.filter((l) => l.license_type === "lifetime").length;

  // Expiring in next 30 days (yearly only, active)
  const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
  const expiringSoon = allLicenses.filter((l) =>
    l.license_type !== "trial" &&
    l.license_type !== "lifetime" &&
    l.status === "active" &&
    l.expiry_date &&
    new Date(l.expiry_date) >= now &&
    new Date(l.expiry_date) <= in30
  ).length;

  // ── Chart — daily collection last 30 days ──────────────────────────
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label   = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const revenue = paid
      .filter((p) => p.paid_date === dateStr)
      .reduce((s, p) => s + p.amount, 0);
    return { date: label, revenue };
  });

  // ── Recent payments (last 6 paid installments) ────────────────────
  const recentPaid = [...paid]
    .sort((a, b) => (b.paid_date ?? "").localeCompare(a.paid_date ?? ""))
    .slice(0, 6);

  // Attach pharmacy name
  const licenseMap = Object.fromEntries(allLicenses.map((l) => [l.license_key, l.pharmacy_name]));
  const recentPayments = recentPaid.map((i) => ({
    ...i,
    pharmacy_name: licenseMap[i.license_key] ?? i.license_key,
  }));

  // ── Overdue installments (top 5 by amount) ───────────────────────
  const overdueItems = overdue
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((i) => ({
      ...i,
      pharmacy_name: licenseMap[i.license_key] ?? i.license_key,
      daysOverdue: Math.floor((now.getTime() - new Date(i.due_date + "T00:00:00").getTime()) / 86400000),
    }));

  // ── Recently added licenses (last 5) ────────────────────────────
  const recentLicenses = [...allLicenses]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);

  // ── Lead metrics ─────────────────────────────────────────────────
  const allLeads       = (leads ?? []) as Array<{
    id: string; owner_name: string; pharmacy_name: string | null;
    status: string; created_at: string;
    lead_followups: { next_followup_date: string | null }[];
  }>;
  const activeLeads    = allLeads.filter((l) => !["converted", "lost"].includes(l.status)).length;
  const weekAgo        = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr     = weekAgo.toISOString().split("T")[0];
  const newLeadsWeek   = allLeads.filter((l) => (l.created_at ?? "").split("T")[0] >= weekAgoStr).length;
  const todayFollowups = allLeads.filter((l) =>
    l.lead_followups?.some((f) => f.next_followup_date === today)
  );

  return {
    totalCollected, totalPending, totalOverdue,
    thisMonthCollected, lastMonthCollected, monthGrowth,
    activeLicenses, trialCount, yearlyCount, lifetimeCount, expiringSoon,
    chartData, recentPayments, overdueItems, recentLicenses,
    totalLicenses: allLicenses.length,
    totalPaymentPlans: (payments ?? []).filter((p) => !testKeys.has(p.license_key)).length,
    activeLeads, newLeadsWeek, todayFollowups,
    totalLeads: allLeads.length,
  };
}

export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div className="space-y-6">

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Total Collected */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{fmt(s.totalCollected)}</div>
          <div className="text-xs text-slate-400">{fmtFull(s.totalCollected)} all time</div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
              <CalendarCheck size={16} className="text-brand-cyan" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{fmt(s.thisMonthCollected)}</div>
          {s.monthGrowth !== null ? (
            <div className={`flex items-center gap-1 text-xs font-medium ${s.monthGrowth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {s.monthGrowth >= 0
                ? <TrendingUp size={11} />
                : <TrendingDown size={11} />}
              {s.monthGrowth >= 0 ? "+" : ""}{s.monthGrowth}% vs last month
            </div>
          ) : (
            <div className="text-xs text-slate-400">No data last month</div>
          )}
        </div>

        {/* Active Licenses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active Licenses</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Key size={16} className="text-violet-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{s.activeLicenses}</div>
          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="text-orange-500 font-semibold">{s.trialCount} trial</span>
            <span className="text-blue-500 font-semibold">{s.yearlyCount} yearly</span>
            <span className="text-emerald-600 font-semibold">{s.lifetimeCount} lifetime</span>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pending Dues</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.totalOverdue > 0 ? "bg-red-500/10" : "bg-slate-100"}`}>
              <AlertTriangle size={16} className={s.totalOverdue > 0 ? "text-red-500" : "text-slate-400"} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{fmt(s.totalPending)}</div>
          {s.totalOverdue > 0 ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-red-500">
              <AlertTriangle size={10} /> {fmtFull(s.totalOverdue)} overdue
            </div>
          ) : (
            <div className="text-xs text-slate-400">No overdue payments</div>
          )}
        </div>

      </div>

      {/* ── Chart ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-900">Collections — Last 30 Days</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Last month: <strong className="text-slate-700">{fmtFull(s.lastMonthCollected)}</strong></span>
            <span>This month: <strong className="text-slate-700">{fmtFull(s.thisMonthCollected)}</strong></span>
          </div>
        </div>
        <RevenueChart data={s.chartData} />
      </div>

      {/* ── Two-column section ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Payments</h3>
            <Link href="/admin/licenses" className="text-xs text-brand-navy font-medium hover:underline">All licenses →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {s.recentPayments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No payments recorded yet</p>
            ) : (
              s.recentPayments.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <IndianRupee size={12} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.pharmacy_name}</p>
                      <p className="text-xs text-slate-400">{fmtDate(p.paid_date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 shrink-0">
                    +{fmtFull(p.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Overdue Payments</h3>
            {s.totalOverdue > 0 && (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                {fmtFull(s.totalOverdue)} overdue
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {s.overdueItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Key size={14} className="text-emerald-500" />
                </div>
                <p className="text-sm text-slate-400">All payments are up to date</p>
              </div>
            ) : (
              s.overdueItems.map((o, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle size={12} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{o.pharmacy_name}</p>
                      <p className="text-xs text-red-400 font-medium">{o.daysOverdue}d overdue · due {fmtDate(o.due_date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-500 shrink-0">
                    {fmtFull(o.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Lead stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Active Leads */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active Leads</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <UserPlus size={16} className="text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{s.activeLeads}</div>
          <div className="text-xs text-slate-400">{s.totalLeads} total leads</div>
        </div>

        {/* New This Week */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New This Week</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <UserPlus size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{s.newLeadsWeek}</div>
          <Link href="/admin/leads" className="text-xs text-brand-navy hover:underline">View all leads →</Link>
        </div>

        {/* Today's Followups */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Due Today</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.todayFollowups.length > 0 ? "bg-amber-500/10" : "bg-slate-100"}`}>
              <PhoneCall size={16} className={s.todayFollowups.length > 0 ? "text-amber-500" : "text-slate-400"} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{s.todayFollowups.length}</div>
          <div className="text-xs text-slate-400">follow-up{s.todayFollowups.length !== 1 ? "s" : ""} scheduled</div>
        </div>

      </div>

      {/* Today's followups list (when non-empty) */}
      {s.todayFollowups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall size={14} className="text-amber-600" />
              <h3 className="text-sm font-bold text-amber-800">Follow-ups Due Today</h3>
            </div>
            <Link href="/admin/leads" className="text-xs font-semibold text-amber-700 hover:underline">View leads →</Link>
          </div>
          <div className="divide-y divide-amber-100">
            {s.todayFollowups.slice(0, 5).map((l) => (
              <Link key={l.id} href={`/admin/leads/${l.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-amber-100/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{l.owner_name}</p>
                  {l.pharmacy_name && <p className="text-xs text-slate-500">{l.pharmacy_name}</p>}
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full capitalize">
                  {l.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* License breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">License Breakdown</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Trial",    count: s.trialCount,    total: s.totalLicenses, color: "bg-orange-400" },
              { label: "1 Year",   count: s.yearlyCount,   total: s.totalLicenses, color: "bg-blue-400"   },
              { label: "Lifetime", count: s.lifetimeCount, total: s.totalLicenses, color: "bg-emerald-500" },
            ].map(({ label, count, total, color }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">{label}</span>
                    <span className="text-slate-400">{count} <span className="text-slate-300">/ {total}</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>{s.totalLicenses} total licenses</span>
            {s.expiringSoon > 0 && (
              <span className="text-amber-500 font-semibold">{s.expiringSoon} expiring soon</span>
            )}
          </div>
        </div>

        {/* Recently added licenses */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recently Added Licenses</h3>
            <Link href="/admin/licenses" className="text-xs text-brand-navy font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {s.recentLicenses.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No licenses yet</p>
            ) : (
              s.recentLicenses.map((l) => {
                const typeStyles: Record<string, string> = {
                  trial:    "bg-orange-100 text-orange-600",
                  yearly:   "bg-blue-100 text-blue-600",
                  lifetime: "bg-emerald-100 text-emerald-700",
                };
                return (
                  <div key={l.license_key} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Key size={12} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/licenses/${encodeURIComponent(l.license_key)}`}
                          className="text-sm font-medium text-slate-900 hover:text-brand-navy truncate block"
                        >
                          {l.pharmacy_name || "—"}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">{l.license_key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${typeStyles[l.license_type] ?? "bg-slate-100 text-slate-500"}`}>
                        {l.license_type}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-500"}`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
