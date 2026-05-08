"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import StateSearchSelect from "./StateSearchSelect";

const SOURCE_OPTIONS = [
  { value: "cold_call",   label: "Cold Call" },
  { value: "referral",    label: "Referral" },
  { value: "website",     label: "Website" },
  { value: "facebook_ads",label: "Facebook Ads" },
  { value: "google_ads",  label: "Google Ads" },
  { value: "exhibition",  label: "Exhibition" },
  { value: "walk_in",     label: "Walk-in" },
  { value: "other",       label: "Other" },
];

const INTEREST_OPTIONS = [
  { value: "trial",    label: "Trial" },
  { value: "yearly",   label: "1 Year" },
  { value: "lifetime", label: "Lifetime" },
  { value: "unsure",   label: "Not Sure Yet" },
];


interface FormState {
  owner_name: string;
  pharmacy_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  source: string;
  license_interest: string;
  notes: string;
}

const EMPTY: FormState = {
  owner_name: "", pharmacy_name: "", phone: "", email: "",
  address: "", city: "", state: "", source: "cold_call",
  license_interest: "", notes: "",
};

export default function AddLeadModal() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pharmacy_name.trim()) { setError("Pharmacy name is required"); return; }
    if (!form.phone.trim()) { setError("Phone is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/leads/create", {
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

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(""); setForm(EMPTY); }}
        className="flex items-center gap-2 bg-brand-navy text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-navy/90 transition-colors"
      >
        <UserPlus size={15} />
        Add Lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Lead</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Owner + Pharmacy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Owner Name</label>
                  <input
                    value={form.owner_name}
                    onChange={(e) => set("owner_name", e.target.value)}
                    placeholder="Dr. Rajesh Kumar"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Pharmacy Name *</label>
                  <input
                    value={form.pharmacy_name}
                    onChange={(e) => set("pharmacy_name", e.target.value)}
                    placeholder="Raj Medical Store"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phone *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="owner@pharmacy.com"
                    type="email"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Bhubaneswar"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
                  <StateSearchSelect value={form.state} onChange={(v) => set("state", v)} />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Shop no., Street, Area"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                />
              </div>

              {/* Source + Interest */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Lead Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => set("source", e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white"
                  >
                    {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">License Interest</label>
                  <select
                    value={form.license_interest}
                    onChange={(e) => set("license_interest", e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white"
                  >
                    <option value="">Not specified</option>
                    {INTEREST_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Initial Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="First impressions, requirements, concerns..."
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan resize-none"
                />
              </div>

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
                  {loading ? "Adding..." : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
