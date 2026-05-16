"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X, Plus, Save, AlertCircle, Store,
  Mail, Phone, Key, User, Smartphone, FlaskConical,
} from "lucide-react";

const LICENSE_TYPES = [
  { value: "trial",    label: "Trial",    sublabel: "7 days",  cls: "text-orange-600 border-orange-200 bg-orange-50",  activeCls: "bg-orange-500 text-white border-orange-500" },
  { value: "yearly",   label: "1 Year",   sublabel: "365 days", cls: "text-blue-600 border-blue-200 bg-blue-50",       activeCls: "bg-blue-600 text-white border-blue-600"    },
  { value: "lifetime", label: "Lifetime", sublabel: "Forever",  cls: "text-emerald-700 border-emerald-200 bg-emerald-50", activeCls: "bg-emerald-600 text-white border-emerald-600" },
] as const;

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy transition-colors placeholder:text-slate-300";

export default function CreateLicenseModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // form state
  const [pharmacyName, setPharmacyName] = useState("");
  const [licenseType, setLicenseType] = useState<"trial" | "yearly" | "lifetime">("yearly");
  const [plan, setPlan] = useState("Standard");
  const [maxMachines, setMaxMachines] = useState("1");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");

  const [mobileAddon, setMobileAddon] = useState(false);
  const [isTest, setIsTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setPharmacyName(""); setLicenseType("yearly"); setPlan("Standard");
    setMaxMachines("1"); setOwnerEmail(""); setContactEmail("");
    setContactPhone(""); setAddress(""); setMobileAddon(false); setIsTest(false); setError(null);
  }

  function close() { setOpen(false); resetForm(); }

  async function submit() {
    setError(null);
    if (!pharmacyName.trim()) { setError("Pharmacy name is required"); return; }
    if (!ownerEmail.trim())   { setError("Owner email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      setError("Enter a valid owner email address"); return;
    }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setError("Contact email address is not valid"); return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/licenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyName:  pharmacyName.trim(),
          licenseType,
          plan:          plan.trim() || "Standard",
          maxMachines:   Number(maxMachines) || 1,
          ownerEmail:    ownerEmail.trim(),
          contactEmail:  contactEmail.trim(),
          contactPhone:  contactPhone.trim(),
          address:       address.trim(),
          mobileAddon,
          isTest,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || `Error ${res.status}`); return; }
      close();
      router.push(`/admin/licenses/${encodeURIComponent(json.licenseKey)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy/90 transition-all shadow-sm"
      >
        <Plus size={15} /> New License
      </button>

      {/* Modal backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                  <Key size={16} className="text-brand-navy" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create New License</h2>
                  <p className="text-xs text-slate-400 mt-0.5">License key will be auto-generated</p>
                </div>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Section: Pharmacy */}
              <div className="space-y-3">
                <SectionLabel icon={<Store size={13} />} label="Pharmacy Details" />
                <Field label="Pharmacy Name" required>
                  <input
                    type="text"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="e.g. Sharma Medical Store"
                    className={inputCls}
                    autoFocus
                  />
                </Field>
                <Field label="Address">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop no., Street, City, State — PIN"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>

              {/* Section: License */}
              <div className="space-y-3">
                <SectionLabel icon={<Key size={13} />} label="License Details" />
                <Field label="License Type" required>
                  <div className="grid grid-cols-3 gap-2">
                    {LICENSE_TYPES.map(({ value, label, sublabel, cls, activeCls }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLicenseType(value)}
                        className={`flex flex-col items-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${licenseType === value ? activeCls : cls}`}
                      >
                        <span>{label}</span>
                        <span className={`text-[10px] font-normal mt-0.5 ${licenseType === value ? "opacity-80" : "opacity-60"}`}>{sublabel}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Plan">
                    <input
                      type="text"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      placeholder="Standard"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Max Machines">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxMachines}
                      onChange={(e) => setMaxMachines(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* Section: Add-ons */}
              <div className="space-y-3">
                <SectionLabel icon={<Smartphone size={13} />} label="Add-ons" />
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={mobileAddon}
                    onChange={(e) => setMobileAddon(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-emerald-500" />
                      Mobile Scanner App
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Include mobile add-on — customer gets the Android scanner app download link in their invoice email.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-amber-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={isTest}
                    onChange={(e) => setIsTest(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <FlaskConical size={14} className="text-amber-500" />
                      Test Account
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mark as a test/demo license — its payments are excluded from revenue &amp; profit reports.
                    </p>
                  </div>
                </label>
              </div>

              {/* Section: Contact */}
              <div className="space-y-3">
                <SectionLabel icon={<User size={13} />} label="Contact Information" />
                <Field label="Owner Email" required>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@pharmacy.com"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
                <Field label="Contact Email">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Same as owner email if left blank"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    Used for invoices &amp; notifications. Defaults to owner email if blank.
                  </p>
                </Field>
                <Field label="Phone">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="9876543210"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
              <p className="text-xs text-slate-400">
                License key is auto-generated &amp; cannot be changed later.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={close}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all"
                >
                  <Save size={14} /> {saving ? "Creating…" : "Create License"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
      {icon} {label}
    </div>
  );
}
