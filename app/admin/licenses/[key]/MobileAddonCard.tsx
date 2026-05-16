"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, ToggleLeft, ToggleRight, Save, Plus, Trash2,
  CheckCircle2, Clock, AlertCircle, Pencil, X, RefreshCw,
  AlertTriangle, ChevronDown, ChevronUp, History,
} from "lucide-react";
import type { PaymentPlan, PaymentInstallment } from "./page";

const METHOD_OPTIONS = [
  { value: "cash",          label: "Cash" },
  { value: "upi",           label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "razorpay",      label: "Razorpay" },
  { value: "cheque",        label: "Cheque" },
  { value: "other",         label: "Other" },
];
const METHOD_LABELS: Record<string, string> = Object.fromEntries(
  METHOD_OPTIONS.map(({ value, label }) => [value, label])
);

const today = () => new Date().toISOString().split("T")[0];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
}

interface Props {
  licenseKey: string;
  mobileAddon: boolean;
  mobileAddonType: string | null;
  mobileAddonExpiry: string | null;
  mobilePaymentPlans: PaymentPlan[];   // sorted newest first
  defaults?: {
    baseAmount: number;
    gstRate: number;
  };
}

export default function MobileAddonCard({
  licenseKey,
  mobileAddon,
  mobileAddonType,
  mobileAddonExpiry,
  mobilePaymentPlans,
  defaults,
}: Props) {
  const router = useRouter();

  // Current cycle = newest; past cycles = the rest
  const currentCycle: PaymentPlan | null = mobilePaymentPlans[0] ?? null;
  const pastCycles: PaymentPlan[] = mobilePaymentPlans.slice(1);

  // ── Addon toggle ──────────────────────────────────────────────
  const [toggling, setToggling] = useState(false);

  // ── Addon settings ────────────────────────────────────────────
  const [editingSettings, setEditingSettings] = useState(false);
  const [addonType, setAddonType] = useState(mobileAddonType ?? "yearly");
  const [addonExpiry, setAddonExpiry] = useState(mobileAddonExpiry ?? "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // ── Create first cycle ───────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBaseAmount, setNewBaseAmount] = useState(defaults && defaults.baseAmount > 0 ? String(Math.round(defaults.baseAmount * 100) / 100) : "");
  const [newGstRate, setNewGstRate] = useState(defaults ? String(defaults.gstRate) : "18");
  const [applyGst, setApplyGst] = useState(true);
  const [newDueDate, setNewDueDate] = useState(today());
  const [newNotes, setNewNotes] = useState("");
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [firstMethod, setFirstMethod] = useState("cash");
  const [firstRef, setFirstRef] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Renew ─────────────────────────────────────────────────────
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [renewBase, setRenewBase] = useState(defaults && defaults.baseAmount > 0 ? String(Math.round(defaults.baseAmount * 100) / 100) : "");
  const [renewGst, setRenewGst] = useState(defaults ? String(defaults.gstRate) : "18");
  const [renewApplyGst, setRenewApplyGst] = useState(true);
  const [renewPaid, setRenewPaid] = useState(false);
  const [renewMethod, setRenewMethod] = useState("cash");
  const [renewRef, setRenewRef] = useState("");
  const [renewNotes, setRenewNotes] = useState("");
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  // ── Delete cycle ─────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Edit installment ──────────────────────────────────────────
  const [editingInst, setEditingInst] = useState<PaymentInstallment | null>(null);
  const [instPaidDate, setInstPaidDate] = useState("");
  const [instMethod, setInstMethod] = useState("upi");
  const [instRef, setInstRef] = useState("");
  const [savingInst, setSavingInst] = useState(false);
  const [instError, setInstError] = useState<string | null>(null);

  // ── Show past cycles ──────────────────────────────────────────
  const [showPast, setShowPast] = useState(false);

  // ── Renewal status ────────────────────────────────────────────
  const renewalInfo = useMemo(() => {
    if (!mobileAddonExpiry) return null;
    const days = daysBetween(today(), mobileAddonExpiry);
    if (days < 0) return { kind: "expired", days: Math.abs(days) } as const;
    if (days <= 30) return { kind: "due_soon", days } as const;
    return { kind: "ok", days } as const;
  }, [mobileAddonExpiry]);

  // ── Toggle addon ──────────────────────────────────────────────
  async function toggleAddon() {
    setToggling(true);
    await fetch("/api/admin/licenses/update-mobile-addon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        mobileAddon: !mobileAddon,
        mobileAddonType: !mobileAddon ? (mobileAddonType ?? "yearly") : null,
        mobileAddonExpiry: !mobileAddon ? (mobileAddonExpiry ?? null) : null,
      }),
    });
    router.refresh();
    setToggling(false);
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsError(null);
    const res = await fetch("/api/admin/licenses/update-mobile-addon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        mobileAddon: true,
        mobileAddonType: addonType || null,
        mobileAddonExpiry: addonExpiry || null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingSettings(false);
    if (!res.ok) { setSettingsError(json.error ?? "Failed to save"); return; }
    setEditingSettings(false);
    router.refresh();
  }

  async function createFirstCycle() {
    setCreateError(null);
    const base = parseFloat(newBaseAmount);
    if (!base || base <= 0) { setCreateError("Enter a valid amount"); return; }
    setCreating(true);
    const res = await fetch("/api/admin/licenses/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        paymentType: "one_time",
        baseAmount: base,
        gstRate: applyGst ? (parseFloat(newGstRate) || 0) : 0,
        firstDueDate: newDueDate,
        notes: newNotes || null,
        paymentSource: "manual_offline",
        product: "mobile",
        markFirstPaid: alreadyPaid,
        firstPaidMethod: alreadyPaid ? firstMethod : null,
        firstPaidReference: alreadyPaid ? firstRef : null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) { setCreateError(json.error ?? "Failed to create"); return; }

    // Also set the mobile_addon_expiry to cycle_end if not already set
    if (!mobileAddonExpiry) {
      const end = new Date(newDueDate + "T00:00:00");
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
      await fetch("/api/admin/licenses/update-mobile-addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          mobileAddon: true,
          mobileAddonType: "yearly",
          mobileAddonExpiry: end.toISOString().split("T")[0],
        }),
      });
    }

    setShowCreateForm(false);
    setNewBaseAmount(defaults && defaults.baseAmount > 0 ? String(Math.round(defaults.baseAmount * 100) / 100) : "");
    setNewNotes(""); setAlreadyPaid(false); setFirstRef("");
    router.refresh();
  }

  async function renewNow() {
    setRenewError(null);
    const base = parseFloat(renewBase);
    if (!base || base <= 0) { setRenewError("Enter a valid amount"); return; }
    setRenewing(true);
    const res = await fetch("/api/admin/licenses/renew-mobile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        baseAmount: base,
        gstRate: parseFloat(renewGst) || 0,
        applyGst: renewApplyGst,
        markPaid: renewPaid,
        paidMethod: renewPaid ? renewMethod : null,
        paidReference: renewPaid ? renewRef : null,
        notes: renewNotes || null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setRenewing(false);
    if (!res.ok) { setRenewError(json.error ?? "Failed to renew"); return; }
    setShowRenewForm(false);
    setRenewNotes(""); setRenewPaid(false); setRenewRef("");
    router.refresh();
  }

  async function deletePayment(id: string) {
    setDeletingId(id);
    await fetch("/api/admin/licenses/delete-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: id }),
    });
    setDeletingId(null);
    setConfirmDelete(null);
    router.refresh();
  }

  function openEditInst(inst: PaymentInstallment) {
    setEditingInst(inst);
    setInstPaidDate(inst.paid_date ?? today());
    setInstMethod(inst.payment_method ?? "upi");
    setInstRef(inst.reference_id ?? "");
    setInstError(null);
  }

  async function saveInstallment() {
    if (!editingInst) return;
    setSavingInst(true);
    setInstError(null);
    const res = await fetch("/api/admin/licenses/mark-installment-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        installmentId: editingInst.id,
        paidDate: instPaidDate,
        paymentMethod: instMethod,
        referenceId: instRef || null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingInst(false);
    if (!res.ok) { setInstError(json.error ?? "Failed to save"); return; }
    setEditingInst(null);
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900">Mobile Scanner App</h3>
          {mobileAddon && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">Active</span>
          )}
          {mobileAddon && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">Yearly</span>
          )}
        </div>
        <button
          onClick={toggleAddon}
          disabled={toggling}
          title={mobileAddon ? "Disable mobile add-on" : "Enable mobile add-on"}
          className="text-slate-400 hover:text-brand-navy transition-colors disabled:opacity-50"
        >
          {mobileAddon
            ? <ToggleRight size={28} className="text-emerald-500" />
            : <ToggleLeft size={28} />}
        </button>
      </div>

      {!mobileAddon ? (
        <p className="text-xs text-slate-400">Toggle on to activate the mobile scanner add-on. Mobile is billed yearly.</p>
      ) : (
        <div className="space-y-4">

          {/* Renewal alert */}
          {renewalInfo?.kind === "expired" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">Subscription expired</p>
                <p className="text-xs text-red-600 mt-0.5">Expired {renewalInfo.days} day{renewalInfo.days === 1 ? "" : "s"} ago. Renew to keep the mobile app active.</p>
              </div>
              {!showRenewForm && (
                <button onClick={() => setShowRenewForm(true)}
                  className="shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700">
                  <RefreshCw size={12} /> Renew
                </button>
              )}
            </div>
          )}
          {renewalInfo?.kind === "due_soon" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700">Renewal due in {renewalInfo.days} day{renewalInfo.days === 1 ? "" : "s"}</p>
                <p className="text-xs text-amber-600 mt-0.5">Expires on {fmtDate(mobileAddonExpiry)}.</p>
              </div>
              {!showRenewForm && (
                <button onClick={() => setShowRenewForm(true)}
                  className="shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
                  <RefreshCw size={12} /> Renew
                </button>
              )}
            </div>
          )}

          {/* Subscription Details */}
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700">Subscription Details</p>
              {!editingSettings
                ? <button onClick={() => setEditingSettings(true)} className="text-xs text-slate-400 hover:text-brand-navy flex items-center gap-1">
                    <Pencil size={11} /> Edit
                  </button>
                : <button onClick={() => setEditingSettings(false)} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
                    <X size={11} /> Cancel
                  </button>
              }
            </div>
            {editingSettings ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Billing Cycle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["monthly", "yearly", "lifetime"].map((t) => (
                      <button key={t} onClick={() => setAddonType(t)}
                        className={`text-xs font-semibold px-2 py-2 rounded-xl border capitalize transition-all ${addonType === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-500"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Expiry Date {addonType === "lifetime" && <span className="text-slate-300">(leave blank for lifetime)</span>}
                  </label>
                  <input type="date" value={addonExpiry} onChange={(e) => setAddonExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500" />
                </div>
                {settingsError && <p className="text-xs text-red-500">{settingsError}</p>}
                <button onClick={saveSettings} disabled={savingSettings}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl disabled:opacity-60">
                  <Save size={12} /> {savingSettings ? "Saving…" : "Save"}
                </button>
              </div>
            ) : (
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Billing Cycle</span>
                  <span className="font-semibold text-slate-700 capitalize">{mobileAddonType ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expires</span>
                  <span className={`font-semibold ${renewalInfo?.kind === "expired" ? "text-red-600" : renewalInfo?.kind === "due_soon" ? "text-amber-600" : "text-slate-700"}`}>
                    {mobileAddonExpiry ? fmtDate(mobileAddonExpiry) : "Lifetime"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Current cycle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {currentCycle ? "Current Cycle" : "Mobile Payment"}
              </p>
              <div className="flex items-center gap-2">
                {currentCycle && !showRenewForm && (
                  <button onClick={() => setShowRenewForm(true)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all">
                    <RefreshCw size={12} /> Renew
                  </button>
                )}
                {!currentCycle && !showCreateForm && (
                  <button onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-navy hover:text-white transition-all">
                    <Plus size={12} /> Add Plan
                  </button>
                )}
              </div>
            </div>

            {/* Renew form */}
            {showRenewForm && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <RefreshCw size={12} /> Renew Subscription (next year)
                  </p>
                  <button onClick={() => { setShowRenewForm(false); setRenewError(null); }} className="text-emerald-700 hover:text-emerald-900">
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Base Amount (₹) *</label>
                    <input type="number" value={renewBase} onChange={(e) => setRenewBase(e.target.value)} placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">GST Rate (%)</label>
                    {renewApplyGst ? (
                      <input type="number" value={renewGst} onChange={(e) => setRenewGst(e.target.value)} placeholder="18"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 bg-white" />
                    ) : (
                      <div className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400">No GST</div>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={renewApplyGst} onChange={(e) => setRenewApplyGst(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  Apply GST
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={renewPaid} onChange={(e) => setRenewPaid(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  Already collected
                </label>
                {renewPaid && (
                  <div className="grid grid-cols-2 gap-2">
                    <select value={renewMethod} onChange={(e) => setRenewMethod(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                      {METHOD_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <input type="text" value={renewRef} onChange={(e) => setRenewRef(e.target.value)} placeholder="Reference (optional)"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none bg-white" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (optional)</label>
                  <input type="text" value={renewNotes} onChange={(e) => setRenewNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 bg-white" />
                </div>
                <p className="text-[11px] text-emerald-700/80 bg-emerald-100/50 rounded-lg px-2 py-1.5">
                  Expiry will extend by 1 year (from {mobileAddonExpiry ? fmtDate(mobileAddonExpiry) : "today"}).
                </p>
                {renewError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
                    <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium">{renewError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={renewNow} disabled={renewing || !renewBase}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                    <RefreshCw size={13} /> {renewing ? "Renewing…" : "Confirm Renewal"}
                  </button>
                </div>
              </div>
            )}

            {/* First-cycle create form */}
            {showCreateForm && !currentCycle && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">First Yearly Cycle</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">One-time / year</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Base Amount (₹) *</label>
                    <input type="number" value={newBaseAmount} onChange={(e) => setNewBaseAmount(e.target.value)} placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">GST Rate (%)</label>
                    {applyGst ? (
                      <input type="number" value={newGstRate} onChange={(e) => setNewGstRate(e.target.value)} placeholder="18"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                    ) : (
                      <div className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400">No GST</div>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={applyGst} onChange={(e) => setApplyGst(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  Apply GST
                </label>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Payment Date</label>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (optional)</label>
                  <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} />
                  Already collected
                </label>
                {alreadyPaid && (
                  <div className="grid grid-cols-2 gap-2">
                    <select value={firstMethod} onChange={(e) => setFirstMethod(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none">
                      {METHOD_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <input type="text" value={firstRef} onChange={(e) => setFirstRef(e.target.value)} placeholder="Reference (optional)"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" />
                  </div>
                )}
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
                    <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-medium">{createError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={createFirstCycle} disabled={creating || !newBaseAmount}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                    <Save size={13} /> {creating ? "Creating…" : "Create Cycle"}
                  </button>
                  <button onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Current cycle card */}
            {currentCycle && (
              <CycleCard
                cycle={currentCycle}
                isCurrent
                onMarkPaid={openEditInst}
                onDelete={() => setConfirmDelete(currentCycle.id)}
                confirmDelete={confirmDelete === currentCycle.id}
                onConfirmDelete={() => deletePayment(currentCycle.id)}
                onCancelDelete={() => setConfirmDelete(null)}
                deleting={deletingId === currentCycle.id}
              />
            )}
          </div>

          {/* Past cycles */}
          {pastCycles.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <History size={12} /> Past Cycles ({pastCycles.length})
                </span>
                {showPast ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showPast && (
                <div className="space-y-2 mt-2">
                  {pastCycles.map((cyc) => (
                    <CycleCard
                      key={cyc.id}
                      cycle={cyc}
                      isCurrent={false}
                      onMarkPaid={openEditInst}
                      onDelete={() => setConfirmDelete(cyc.id)}
                      confirmDelete={confirmDelete === cyc.id}
                      onConfirmDelete={() => deletePayment(cyc.id)}
                      onCancelDelete={() => setConfirmDelete(null)}
                      deleting={deletingId === cyc.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mark installment paid modal */}
      {editingInst && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 text-sm">Mark Payment as Paid</p>
              <button onClick={() => setEditingInst(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-500">
              Payment — ₹{Math.round(editingInst.amount).toLocaleString("en-IN")}
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Paid Date</label>
              <input type="date" value={instPaidDate} onChange={(e) => setInstPaidDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Payment Method</label>
              <select value={instMethod} onChange={(e) => setInstMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                {METHOD_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Reference ID (optional)</label>
              <input type="text" value={instRef} onChange={(e) => setInstRef(e.target.value)} placeholder="UPI/bank ref"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
            </div>
            {instError && <p className="text-xs text-red-500">{instError}</p>}
            <div className="flex gap-2">
              <button onClick={saveInstallment} disabled={savingInst}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                <Save size={13} /> {savingInst ? "Saving…" : "Mark as Paid"}
              </button>
              <button onClick={() => setEditingInst(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CycleCard ───────────────────────────────────────────────────────
function CycleCard({
  cycle, isCurrent, onMarkPaid, onDelete, confirmDelete, onConfirmDelete, onCancelDelete, deleting,
}: {
  cycle: PaymentPlan;
  isCurrent: boolean;
  onMarkPaid: (inst: PaymentInstallment) => void;
  onDelete: () => void;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  deleting: boolean;
}) {
  const total = Math.round(cycle.total_amount);
  const collected = Math.round(cycle.installments.reduce((s, i) => s + (i.paid_date ? i.amount : 0), 0));
  const pending = Math.max(0, total - collected);
  const isPaid = pending <= 0;

  return (
    <div className={`rounded-xl p-3 space-y-3 ${isCurrent ? "bg-slate-50 border border-slate-200" : "bg-white border border-slate-100"}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs">
          {cycle.cycle_start_date && cycle.cycle_end_date ? (
            <p className="font-semibold text-slate-700">
              {fmtDate(cycle.cycle_start_date)} → {fmtDate(cycle.cycle_end_date)}
            </p>
          ) : (
            <p className="font-semibold text-slate-700">Cycle</p>
          )}
          <p className="text-slate-400 text-[10px]">Created {fmtDate(cycle.created_at.split("T")[0])}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {isPaid ? "Paid" : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div>
          <p className="text-slate-400 text-[10px]">Total</p>
          <p className="font-bold text-slate-800">₹{total.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px]">Collected</p>
          <p className="font-bold text-emerald-600">₹{collected.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px]">Pending</p>
          <p className={`font-bold ${pending > 0 ? "text-red-500" : "text-slate-400"}`}>₹{pending.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Installments (typically 1 for mobile) */}
      <div className="space-y-1.5">
        {cycle.installments.map((inst) => {
          const paid = !!inst.paid_date;
          return (
            <div key={inst.id} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${paid ? "bg-emerald-50" : "bg-amber-50"}`}>
              <div className="flex items-center gap-1.5">
                {paid ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Clock size={11} className="text-amber-500" />}
                <span className="font-semibold text-slate-700">₹{Math.round(inst.amount).toLocaleString("en-IN")}</span>
                <span className="text-slate-400">
                  {paid ? `· ${fmtDate(inst.paid_date)}` : `· due ${fmtDate(inst.due_date)}`}
                </span>
                {paid && inst.payment_method && (
                  <span className="text-slate-400">· {METHOD_LABELS[inst.payment_method] ?? inst.payment_method}</span>
                )}
              </div>
              {!paid && (
                <button onClick={() => onMarkPaid(inst)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200">
                  Mark Paid
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete */}
      <div className="flex justify-end pt-1">
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button onClick={onConfirmDelete} disabled={deleting}
              className="text-[10px] font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-60">
              {deleting ? "Deleting…" : "Confirm delete"}
            </button>
            <button onClick={onCancelDelete}
              className="text-[10px] text-slate-400 hover:text-slate-600 px-2 py-1">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={onDelete}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={10} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
