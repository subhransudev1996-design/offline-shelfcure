"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, BarChart3, Filter, Receipt } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_COLORS,
  categoryLabel,
  paymentMethodLabel,
} from "@/lib/expenses/constants";
import { formatDate } from "@/lib/utils";
import type { ExpenseRow } from "./page";

interface Props {
  initialExpenses: ExpenseRow[];
  loadError: string | null;
}

interface FormState {
  spent_on: string;
  category: string;
  vendor: string;
  description: string;
  amount_rupees: string;
  payment_method: string;
  reference: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  spent_on: new Date().toISOString().slice(0, 10),
  category: "marketing",
  vendor: "",
  description: "",
  amount_rupees: "",
  payment_method: "",
  reference: "",
  notes: "",
});

// Rupees with thousands separators, no decimals. Matches lib/utils.formatCurrency
// but operates on paise directly so callers don't divide everywhere.
function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export default function ExpensesClient({ initialExpenses, loadError }: Props) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>(""); // "YYYY-MM"
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCat && e.category !== filterCat) return false;
      if (filterMonth && !e.spent_on.startsWith(filterMonth)) return false;
      return true;
    });
  }, [expenses, filterCat, filterMonth]);

  const total = filtered.reduce((s, e) => s + e.amount_paise, 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(e: ExpenseRow) {
    setEditing(e);
    setForm({
      spent_on:       e.spent_on,
      category:       e.category,
      vendor:         e.vendor ?? "",
      description:    e.description,
      amount_rupees:  String(Math.round(e.amount_paise) / 100),
      payment_method: e.payment_method ?? "",
      reference:      e.reference ?? "",
      notes:          e.notes ?? "",
    });
    setFormError(null);
    setShowForm(true);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);

    const amount = Number(form.amount_rupees);
    if (!form.description.trim()) return setFormError("Description is required.");
    if (!Number.isFinite(amount) || amount < 0) return setFormError("Amount must be a non-negative number.");

    setSaving(true);
    try {
      const url = editing ? `/api/admin/expenses/${editing.id}` : "/api/admin/expenses";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spent_on:       form.spent_on,
          category:       form.category,
          vendor:         form.vendor,
          description:    form.description,
          amount_rupees:  amount,
          payment_method: form.payment_method || null,
          reference:      form.reference,
          notes:          form.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      const saved: ExpenseRow = json.expense;
      setExpenses((prev) => {
        if (editing) return prev.map((p) => (p.id === saved.id ? saved : p));
        return [saved, ...prev];
      });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(e: ExpenseRow) {
    if (!confirm(`Delete "${e.description}" (${rupees(e.amount_paise)})?`)) return;
    const res = await fetch(`/api/admin/expenses/${e.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Delete failed: ${j.error || res.statusText}`);
      return;
    }
    setExpenses((prev) => prev.filter((p) => p.id !== e.id));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"} · {rupees(total)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/expenses/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            <BarChart3 size={15} /> Report
          </Link>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-light transition-all"
          >
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          Failed to load expenses: {loadError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <Filter size={15} className="text-slate-400" />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
        {(filterCat || filterMonth) && (
          <button
            onClick={() => { setFilterCat(""); setFilterMonth(""); }}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Date", "Category", "Description", "Vendor", "Payment", "Amount", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Receipt size={28} className="mx-auto text-slate-200 mb-2" />
                    {expenses.length ? "No expenses match the current filters." : "No expenses logged yet. Click \"Add Expense\" to start."}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(e.spent_on)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[e.category] ?? "bg-slate-100 text-slate-700"}`}>
                        {categoryLabel(e.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-md">
                      <div className="truncate">{e.description}</div>
                      {e.reference && <div className="text-xs text-slate-400 truncate">Ref: {e.reference}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{e.vendor || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{paymentMethodLabel(e.payment_method)}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">{rupees(e.amount_paise)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{editing ? "Edit expense" : "Add expense"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <input
                    required
                    type="date"
                    value={form.spent_on}
                    onChange={(e) => setForm({ ...form, spent_on: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={input}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <input
                  required
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Google Ads — May campaign"
                  className={input}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount_rupees}
                    onChange={(e) => setForm({ ...form, amount_rupees: e.target.value })}
                    placeholder="0"
                    className={input}
                  />
                </Field>
                <Field label="Vendor">
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    placeholder="optional"
                    className={input}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Payment method">
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className={input}
                  >
                    <option value="">—</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Reference / Invoice #">
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="optional"
                    className={input}
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={input}
                />
              </Field>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-light transition-all disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Add expense"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const input =
  "w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
