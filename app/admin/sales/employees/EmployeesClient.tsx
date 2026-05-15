"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SalesEmployee } from "./page";

const ROLE_OPTIONS = [
  { value: "field_sales", label: "Field Sales" },
  { value: "demo_team",   label: "Demo Team" },
  { value: "admin",       label: "Admin" },
];

const ROLE_BADGE: Record<string, string> = {
  field_sales: "bg-blue-50 text-blue-600",
  demo_team:   "bg-purple-50 text-purple-700",
  admin:       "bg-emerald-50 text-emerald-700",
};

interface AddForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

const EMPTY: AddForm = { full_name: "", email: "", password: "", phone: "", role: "field_sales" };

export default function EmployeesClient({ employees }: { employees: SalesEmployee[] }) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState<AddForm>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [busyId, setBusyId]   = useState<string | null>(null);

  function set(field: keyof AddForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required"); return; }
    if (!form.email.trim())     { setError("Email is required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/sales/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setOpen(false);
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function updateEmployee(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res  = await fetch("/api/admin/sales/employees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = employees.filter((e) => e.is_active).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Employees</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {employees.length} total &nbsp;·&nbsp;
            <span className="text-slate-600 font-medium">{activeCount} active</span>
          </p>
        </div>
        <button
          onClick={() => { setOpen(true); setError(""); setForm(EMPTY); }}
          className="flex items-center gap-2 bg-brand-navy text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-navy/90 transition-colors"
        >
          <UserPlus size={15} />
          Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Name", "Email", "Phone", "Role", "Status", "Added", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!employees.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No sales employees yet</td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-navy to-brand-cyan flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {e.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 whitespace-nowrap">{e.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{e.email ?? "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{e.phone ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={e.role}
                        disabled={busyId === e.id}
                        onChange={(ev) => updateEmployee(e.id, { role: ev.target.value })}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${ROLE_BADGE[e.role] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${e.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-500"}`}>
                        {e.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(e.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        disabled={busyId === e.id}
                        onClick={() => updateEmployee(e.id, { is_active: !e.is_active })}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all disabled:opacity-50 ${
                          e.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        {e.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Sales Employee</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                <input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Rajesh Kumar"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                  <input
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="rajesh@shelfcure.com"
                    type="email"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Temp Password *</label>
                  <input
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="At least 6 characters"
                    type="text"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                The employee signs in to the mobile app with this email and password.
                Ask them to change the password after first login.
              </p>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-slate-500 font-medium hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-navy text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-brand-navy/90 transition-colors disabled:opacity-60"
                >
                  {loading ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
