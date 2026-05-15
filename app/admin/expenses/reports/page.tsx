import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Receipt as ReceiptIcon } from "lucide-react";
import { categoryLabel, CATEGORY_COLORS } from "@/lib/expenses/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Search { range?: string }

// Buckets to choose from on the toggle bar. "all" = no date filter.
const RANGES = [
  { key: "30d",  label: "Last 30 days", days: 30  },
  { key: "90d",  label: "Last 90 days", days: 90  },
  { key: "12m",  label: "Last 12 months", days: 365 },
  { key: "all",  label: "All time",     days: null as number | null },
];

function startOf(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

export default async function ExpensesReportPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const rangeKey = sp.range && RANGES.some((r) => r.key === sp.range) ? sp.range : "90d";
  const range = RANGES.find((r) => r.key === rangeKey)!;
  const fromDate = range.days != null ? startOf(range.days) : null;

  const supabase = createServiceClient();

  // Revenue side — paid web_orders. Filter on paid_at.
  let revenueQ = supabase
    .from("web_orders")
    .select("amount_total, paid_at")
    .eq("payment_status", "paid");
  if (fromDate) revenueQ = revenueQ.gte("paid_at", fromDate);
  const { data: orders, error: ordersErr } = await revenueQ;

  // Expense side — every expense in the window. Filter on spent_on.
  let expQ = supabase
    .from("expenses")
    .select("amount_paise, category, spent_on");
  if (fromDate) expQ = expQ.gte("spent_on", fromDate);
  const { data: expenses, error: expensesErr } = await expQ;

  // Totals (paise).
  const revenuePaise = (orders ?? []).reduce((s, o) => s + (o.amount_total ?? 0), 0);
  const expensesPaise = (expenses ?? []).reduce((s, e) => s + (e.amount_paise ?? 0), 0);
  const profitPaise = revenuePaise - expensesPaise;
  const margin = revenuePaise > 0 ? (profitPaise / revenuePaise) * 100 : 0;

  // Category breakdown.
  const byCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + (e.amount_paise ?? 0));
  }
  const catRows = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1]);
  const maxCat = catRows.reduce((m, [, v]) => Math.max(m, v), 0);

  // Monthly trend — last 12 buckets touching the data, regardless of range.
  // Build a stable set of month keys from the data + the requested window.
  const monthKeys = new Set<string>();
  for (const o of orders ?? [])     if (o.paid_at) monthKeys.add(monthKey(o.paid_at));
  for (const e of expenses ?? [])   if (e.spent_on) monthKeys.add(monthKey(e.spent_on));
  // If nothing fell in range, show at least the current month so the chart isn't blank.
  if (!monthKeys.size) monthKeys.add(new Date().toISOString().slice(0, 7));

  const months = Array.from(monthKeys).sort();
  const monthly = months.map((mk) => {
    const rev = (orders ?? [])
      .filter((o) => o.paid_at && monthKey(o.paid_at) === mk)
      .reduce((s, o) => s + (o.amount_total ?? 0), 0);
    const exp = (expenses ?? [])
      .filter((e) => e.spent_on && monthKey(e.spent_on) === mk)
      .reduce((s, e) => s + (e.amount_paise ?? 0), 0);
    return { mk, rev, exp, profit: rev - exp };
  });
  const chartMax = monthly.reduce((m, r) => Math.max(m, r.rev, r.exp), 0) || 1;

  const error = ordersErr?.message || expensesErr?.message || null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/expenses" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-navy mb-1">
            <ArrowLeft size={13} /> Back to expenses
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Finance Report</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Revenue from paid orders vs expenses logged. {range.label.toLowerCase()}.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 flex items-center gap-0.5">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/expenses/reports?range=${r.key}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                r.key === rangeKey
                  ? "bg-brand-navy text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          Failed to load report: {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={<TrendingUp size={16} className="text-emerald-600" />}
          label="Revenue"
          value={formatCurrency(revenuePaise / 100)}
          sub={`${orders?.length ?? 0} paid orders`}
          tone="emerald"
        />
        <Kpi
          icon={<TrendingDown size={16} className="text-rose-600" />}
          label="Expenses"
          value={formatCurrency(expensesPaise / 100)}
          sub={`${expenses?.length ?? 0} entries`}
          tone="rose"
        />
        <Kpi
          icon={<Wallet size={16} className={profitPaise >= 0 ? "text-brand-navy" : "text-rose-600"} />}
          label="Net Profit"
          value={formatCurrency(profitPaise / 100)}
          sub={profitPaise >= 0 ? "In the black" : "In the red"}
          tone={profitPaise >= 0 ? "navy" : "rose"}
        />
        <Kpi
          icon={<ReceiptIcon size={16} className="text-violet-600" />}
          label="Margin"
          value={`${margin.toFixed(1)}%`}
          sub={revenuePaise > 0 ? "profit ÷ revenue" : "no revenue yet"}
          tone="violet"
        />
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Monthly trend</h2>
        <p className="text-xs text-slate-400 mb-4">Revenue (green) vs expenses (rose) per month. Profit shown beneath.</p>
        {monthly.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No data in this range yet.</p>
        ) : (
          <div className="space-y-3">
            {monthly.map((m) => (
              <div key={m.mk} className="grid grid-cols-[60px_1fr_120px] items-center gap-3">
                <div className="text-xs font-semibold text-slate-500">{monthLabel(m.mk)}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(m.rev / chartMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-20 text-right">{formatCurrency(m.rev / 100)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all"
                        style={{ width: `${(m.exp / chartMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-20 text-right">{formatCurrency(m.exp / 100)}</span>
                  </div>
                </div>
                <div className={`text-right text-sm font-bold ${m.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {m.profit >= 0 ? "+" : ""}{formatCurrency(m.profit / 100)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Where the money went</h2>
        <p className="text-xs text-slate-400 mb-4">Expenses by category, biggest first.</p>
        {catRows.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No expenses logged in this range.</p>
        ) : (
          <div className="space-y-2.5">
            {catRows.map(([cat, paise]) => {
              const pct = expensesPaise > 0 ? (paise / expensesPaise) * 100 : 0;
              return (
                <div key={cat} className="grid grid-cols-[160px_1fr_100px_60px] items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-700"}`}>
                    {categoryLabel(cat)}
                  </span>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-navy rounded-full transition-all"
                      style={{ width: `${maxCat > 0 ? (paise / maxCat) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 text-right">
                    {formatCurrency(paise / 100)}
                  </span>
                  <span className="text-xs text-slate-400 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "rose" | "navy" | "violet";
}) {
  const toneRing: Record<typeof tone, string> = {
    emerald: "bg-emerald-50",
    rose:    "bg-rose-50",
    navy:    "bg-brand-navy/10",
    violet:  "bg-violet-50",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${toneRing[tone]}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}
