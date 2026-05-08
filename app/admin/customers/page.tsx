import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CustomerRow {
  email: string;
  customer_name: string;
  phone: string;
  purchases_count: number;
  total_spent: number;
  last_purchase: string;
}

export default async function CustomersPage() {
  const supabase = createServiceClient();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("email, customer_name, phone, amount_total, paid_at, payment_status")
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false });

  // Group by email
  const customerMap = new Map<string, CustomerRow>();
  for (const p of purchases ?? []) {
    const existing = customerMap.get(p.email);
    if (existing) {
      existing.purchases_count += 1;
      existing.total_spent += p.amount_total;
      if (!existing.last_purchase || new Date(p.paid_at) > new Date(existing.last_purchase)) {
        existing.last_purchase = p.paid_at;
      }
    } else {
      customerMap.set(p.email, {
        email: p.email,
        customer_name: p.customer_name,
        phone: p.phone,
        purchases_count: 1,
        total_spent: p.amount_total,
        last_purchase: p.paid_at,
      });
    }
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.last_purchase).getTime() - new Date(a.last_purchase).getTime()
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-400 mt-0.5">{customers.length} paying customers</p>
      </div>

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
                  <td colSpan={7} className="text-center py-12 text-slate-400">No paying customers yet</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.email} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-navy to-brand-cyan flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {c.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 whitespace-nowrap">{c.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{c.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{c.phone}</td>
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
                        <a
                          href={`https://wa.me/91${c.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-500 hover:text-white transition-all font-medium"
                        >
                          WhatsApp
                        </a>
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
