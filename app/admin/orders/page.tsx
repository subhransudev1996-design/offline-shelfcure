import { createServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Download } from "lucide-react";
import type { Purchase } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = createServiceClient();
  const { data: orders } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-700",
      pending: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-400 mt-0.5">{orders?.length ?? 0} total orders</p>
        </div>
        <a
          href="/api/admin/export/orders"
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-light transition-all"
        >
          <Download size={15} /> Export CSV
        </a>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Date", "Customer", "Email", "Phone", "Amount", "Status", "Payment ID"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!orders?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order: Purchase) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-xs">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {order.customer_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {order.email}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {order.phone}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(order.amount_total / 100)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusBadge(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono whitespace-nowrap">
                      {order.razorpay_payment_id
                        ? order.razorpay_payment_id.slice(0, 18) + "…"
                        : "—"}
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
