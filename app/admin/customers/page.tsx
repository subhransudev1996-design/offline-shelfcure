import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CustomerRow {
  email: string;
  customer_name: string | null;
  phone: string | null;
  purchases_count: number;
  total_spent: number;
  last_purchase: string;
}

// Cap the query so a long history doesn't blow up this page. Tune later if
// you have more than this many paid purchases.
const PURCHASES_QUERY_LIMIT = 5000;

// Normalise an Indian phone number for wa.me. Strips spaces, dashes, parens,
// any leading `+`, `0` or `91`, then prefixes a single `91`. Returns null
// when there's nothing usable.
function waNumber(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  let local = digits;
  if (local.startsWith("91") && local.length > 10) local = local.slice(2);
  else if (local.startsWith("0")) local = local.replace(/^0+/, "");
  if (local.length < 6) return null; // clearly not a real number
  return `91${local}`;
}

export default async function CustomersPage() {
  const supabase = createServiceClient();

  // Select * so that a missing optional column (e.g. an older deploy that
  // hasn't run supabase_fix_purchases.sql yet) doesn't crash the whole page —
  // we just render blanks for whatever field is absent. The error banner
  // below still surfaces real failures.
  const { data: purchases, error } = await supabase
    .from("web_orders")
    .select("*")
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false })
    .limit(PURCHASES_QUERY_LIMIT);

  // Group by email — skip rows with no email since email is the grouping key.
  const customerMap = new Map<string, CustomerRow>();
  for (const p of purchases ?? []) {
    if (!p.email) continue;
    const existing = customerMap.get(p.email);
    if (existing) {
      existing.purchases_count += 1;
      existing.total_spent += p.amount_total ?? 0;
      if (!existing.last_purchase || new Date(p.paid_at) > new Date(existing.last_purchase)) {
        existing.last_purchase = p.paid_at;
      }
      // Fill in name/phone from later rows if the first had none.
      if (!existing.customer_name && p.customer_name) existing.customer_name = p.customer_name;
      if (!existing.phone && p.phone)                 existing.phone         = p.phone;
    } else {
      customerMap.set(p.email, {
        email:           p.email,
        customer_name:   p.customer_name ?? null,
        phone:           p.phone ?? null,
        purchases_count: 1,
        total_spent:     p.amount_total ?? 0,
        last_purchase:   p.paid_at,
      });
    }
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime()
  );

  const hitLimit = (purchases?.length ?? 0) >= PURCHASES_QUERY_LIMIT;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-400 mt-0.5">{customers.length} paying customers</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          Failed to load purchases: {error.message}
        </div>
      )}

      {hitLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700">
          Showing customers derived from the most recent {PURCHASES_QUERY_LIMIT.toLocaleString("en-IN")} paid
          purchases. Older purchases may not be reflected in the totals below.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Customer", "Email", "Phone", "Purchases", "Total Spent", "Last Purchase", "Contact"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!customers.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {error ? "No customers to show — see error above." : "No paying customers yet"}
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const displayName = c.customer_name?.trim() || c.email;
                  const initial = (displayName.charAt(0) || "?").toUpperCase();
                  const wa = waNumber(c.phone);
                  return (
                  <tr key={c.email} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-navy to-brand-cyan flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initial}
                        </div>
                        <span className="font-medium text-slate-900 whitespace-nowrap">{displayName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{c.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.phone ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="bg-brand-navy/10 text-brand-navy text-xs font-bold px-2 py-0.5 rounded-full">
                        {c.purchases_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      ₹{(c.total_spent / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(c.last_purchase)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${c.email}`}
                          className="text-xs px-2.5 py-1 rounded-lg bg-brand-navy/10 text-brand-navy hover:bg-brand-navy hover:text-white transition-all font-medium"
                        >
                          Email
                        </a>
                        {wa ? (
                          <a
                            href={`https://wa.me/${wa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-500 hover:text-white transition-all font-medium"
                          >
                            WhatsApp
                          </a>
                        ) : (
                          <span
                            title="No valid phone number on file"
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 font-medium cursor-not-allowed"
                          >
                            WhatsApp
                          </span>
                        )}
                      </div>
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
