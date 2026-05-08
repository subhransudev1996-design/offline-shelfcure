"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy, Check, ToggleLeft, ToggleRight,
  Phone, Mail, MessageCircle, Save, Pencil, X,
  CreditCard, Plus, IndianRupee, CheckCircle2, Clock,
  Globe, Wallet, AlertCircle, Trash2, SendHorizonal, Sparkles, Printer,
  Cpu, Shield, XCircle, Camera, RotateCcw, ArrowUpCircle,
} from "lucide-react";
import type { PaymentPlan, PaymentInstallment } from "./page";

interface Props {
  licenseKey: string;
  licenseType: string;
  isActive: boolean;
  ownerEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  maxMachines: number;
  aiCredits: number;
  aiCreditsTotal: number;
  labelScansUsed: number;
  activatedMachines: { machine_id: string; activated_at: string }[];
  paymentPlan: PaymentPlan | null;
}

const PAYMENT_TYPE_OPTIONS = [
  { value: "one_time",     label: "One-time" },
  { value: "3_month_emi",  label: "3-Month EMI" },
  { value: "6_month_emi",  label: "6-Month EMI" },
] as const;

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  one_time:      "One-time Payment",
  "3_month_emi": "3-Month EMI",
  "6_month_emi": "6-Month EMI",
};

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

export default function LicenseDetailClient({
  licenseKey, licenseType, isActive, ownerEmail, contactEmail, contactPhone,
  maxMachines, aiCredits, aiCreditsTotal, labelScansUsed, activatedMachines, paymentPlan,
}: Props) {
  const router = useRouter();

  // ── License key copy ──────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── Status toggle ─────────────────────────────────────────────
  const [toggling, setToggling] = useState(false);

  // ── Contact edit ──────────────────────────────────────────────
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [ownerEmailState, setOwnerEmailState] = useState(ownerEmail ?? "");
  const [email, setEmail] = useState(contactEmail ?? "");
  const [phone, setPhone] = useState(contactPhone ?? "");

  // ── Create payment plan ───────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPayType, setNewPayType] = useState<"one_time" | "3_month_emi" | "6_month_emi">("one_time");
  const [newBaseAmount, setNewBaseAmount] = useState("");
  const [newGstRate, setNewGstRate] = useState("18");
  const [newDueDate, setNewDueDate] = useState(today());
  const [newNotes, setNewNotes] = useState("");
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [firstMethod, setFirstMethod] = useState("cash");
  const [firstRef, setFirstRef] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Edit payment plan ─────────────────────────────────────────
  const [editingPlan, setEditingPlan] = useState(false);
  const [editPayType, setEditPayType] = useState(paymentPlan?.payment_type ?? "one_time");
  const [editBaseAmount, setEditBaseAmount] = useState(String(paymentPlan?.base_amount ?? paymentPlan?.total_amount ?? ""));
  const [editGstRate, setEditGstRate] = useState(String(paymentPlan?.gst_rate ?? "0"));
  const [editNotes, setEditNotes] = useState(paymentPlan?.notes ?? "");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // ── Delete payment plan ───────────────────────────────────────
  const [deleting, setDeleting] = useState(false);

  // ── Send invoice email ────────────────────────────────────────
  const [sendingMail, setSendingMail] = useState(false);
  const [mailSent, setMailSent] = useState<string | null>(null);
  const [mailError, setMailError] = useState<string | null>(null);

  // ── Delete license ────────────────────────────────────────────
  const [confirmDeleteLicense, setConfirmDeleteLicense] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState(false);

  // ── AI credits ───────────────────────────────────────────────
  const [editingCredits, setEditingCredits] = useState(false);
  const [creditsInput, setCreditsInput] = useState(String(aiCreditsTotal));
  const [savingCredits, setSavingCredits] = useState(false);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  // ── AI Label Scans ────────────────────────────────────────────
  const [resettingScans, setResettingScans] = useState(false);
  const [scansResetDone, setScansResetDone] = useState(false);
  const [editingScans, setEditingScans] = useState(false);
  const [scansInput, setScansInput] = useState(String(labelScansUsed));
  const [savingScans, setSavingScans] = useState(false);
  const [scansError, setScansError] = useState<string | null>(null);

  // ── Remove machine ────────────────────────────────────────────
  const [removingMachine, setRemovingMachine] = useState<string | null>(null);

  // ── Convert plan ─────────────────────────────────────────────
  const [convertTarget, setConvertTarget] = useState<"yearly" | "lifetime" | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // ── Edit installment modal ────────────────────────────────────
  const [editingInst, setEditingInst] = useState<PaymentInstallment | null>(null);
  const [instAmount, setInstAmount] = useState("");
  const [instDueDate, setInstDueDate] = useState("");
  const [instPaidDate, setInstPaidDate] = useState("");
  const [instMethod, setInstMethod] = useState("upi");
  const [instRef, setInstRef] = useState("");
  const [instNotes, setInstNotes] = useState("");
  const [savingInst, setSavingInst] = useState(false);
  const [instError, setInstError] = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────
  function copyKey() {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openEditInst(inst: PaymentInstallment) {
    setEditingInst(inst);
    setInstAmount(String(inst.amount));
    setInstDueDate(inst.due_date);
    setInstPaidDate(inst.paid_date ?? "");
    setInstMethod(inst.payment_method ?? "upi");
    setInstRef(inst.reference_id ?? "");
    setInstNotes(inst.notes ?? "");
    setInstError(null);
  }

  // ── API calls ─────────────────────────────────────────────────
  async function toggleStatus() {
    setToggling(true);
    await fetch("/api/admin/licenses/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, isActive: !isActive }),
    });
    router.refresh();
    setToggling(false);
  }

  async function deleteLicense() {
    setDeletingLicense(true);
    await fetch("/api/admin/licenses/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    router.push("/admin/licenses");
  }

  async function saveCredits() {
    setCreditsError(null);
    const val = Number(creditsInput);
    if (isNaN(val) || val < 0 || !Number.isInteger(val)) {
      setCreditsError("Enter a valid whole number (0 or more)");
      return;
    }
    setSavingCredits(true);
    const res = await fetch("/api/admin/licenses/update-ai-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, aiCredits: val }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingCredits(false);
    if (!res.ok) { setCreditsError(json.error || "Failed to save"); return; }
    setEditingCredits(false);
    router.refresh();
  }

  async function resetLabelScans() {
    setResettingScans(true);
    const res = await fetch("/api/admin/licenses/reset-label-scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    setResettingScans(false);
    if (res.ok) { setScansResetDone(true); router.refresh(); }
  }

  async function saveScansCount() {
    setScansError(null);
    const val = Number(scansInput);
    if (isNaN(val) || val < 0 || !Number.isInteger(val)) {
      setScansError("Enter a valid whole number (0 or more)");
      return;
    }
    setSavingScans(true);
    const res = await fetch("/api/admin/licenses/update-label-scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, labelScansUsed: val }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingScans(false);
    if (!res.ok) { setScansError(json.error || "Failed to save"); return; }
    setEditingScans(false);
    router.refresh();
  }

  async function saveContact() {
    if (!ownerEmailState.trim()) return;
    setSavingContact(true);
    await fetch("/api/admin/licenses/update-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        ownerEmail:   ownerEmailState,
        contactEmail: email,
        contactPhone: phone,
      }),
    });
    setSavingContact(false);
    setEditingContact(false);
    router.refresh();
  }

  async function createPayment() {
    setCreateError(null);
    const base = parseFloat(newBaseAmount);
    if (!newBaseAmount || isNaN(base) || base <= 0) { setCreateError("Enter a valid base amount"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/licenses/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          paymentType:        newPayType,
          baseAmount:         base,
          gstRate:            parseFloat(newGstRate) || 0,
          firstDueDate:       newDueDate,
          notes:              newNotes,
          paymentSource:      "manual_offline",
          markFirstPaid:      alreadyPaid,
          firstPaidMethod:    firstMethod,
          firstPaidReference: firstRef,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setCreateError(json.error || `Error ${res.status}`); return; }
      setShowCreateForm(false);
      setNewBaseAmount(""); setNewNotes(""); setAlreadyPaid(false); setFirstRef("");
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Network error");
    } finally {
      setCreating(false);
    }
  }

  async function savePlan() {
    setPlanError(null);
    const base = parseFloat(editBaseAmount);
    if (!editBaseAmount || isNaN(base) || base <= 0) { setPlanError("Enter a valid base amount"); return; }
    setSavingPlan(true);
    try {
      const res = await fetch("/api/admin/licenses/edit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: paymentPlan!.id, paymentType: editPayType, baseAmount: base, gstRate: parseFloat(editGstRate) || 0, notes: editNotes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setPlanError(json.error || `Error ${res.status}`); return; }
      setEditingPlan(false);
      router.refresh();
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSavingPlan(false);
    }
  }

  async function deletePayment() {
    if (!paymentPlan) return;
    if (!confirm("Delete this payment plan and all its installment history? This cannot be undone.")) return;
    setDeleting(true);
    await fetch("/api/admin/licenses/delete-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: paymentPlan.id }),
    });
    setDeleting(false);
    router.refresh();
  }

  async function sendInvoice() {
    setMailError(null);
    setMailSent(null);
    setSendingMail(true);
    try {
      const res = await fetch("/api/admin/licenses/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setMailError(json.error || `Error ${res.status}`); return; }
      setMailSent(json.sentTo ?? "customer");
      setTimeout(() => setMailSent(null), 6000);
    } catch (err) {
      setMailError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSendingMail(false);
    }
  }

  async function removeMachine(machineId: string | null) {
    const msg = machineId
      ? `Remove machine ${machineId} from this license?`
      : "Remove ALL machines from this license? The customer will need to re-activate.";
    if (!confirm(msg)) return;
    setRemovingMachine(machineId ?? "all");
    await fetch("/api/admin/licenses/remove-machine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, machineId }),
    });
    setRemovingMachine(null);
    router.refresh();
  }

  async function convertPlan() {
    if (!convertTarget) return;
    setConvertError(null);
    setConverting(true);
    try {
      const res = await fetch("/api/admin/licenses/convert-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey, targetPlan: convertTarget }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setConvertError(json.error || "Failed to convert"); return; }
      setConvertTarget(null);
      router.refresh();
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "Network error");
    } finally {
      setConverting(false);
    }
  }

  async function saveInstallment() {
    if (!editingInst) return;
    setInstError(null);
    const amt = parseFloat(instAmount);
    if (!instAmount || isNaN(amt) || amt <= 0) { setInstError("Enter a valid amount"); return; }
    if (!instDueDate) { setInstError("Enter a due date"); return; }
    setSavingInst(true);
    try {
      const res = await fetch("/api/admin/licenses/edit-installment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId: editingInst.id,
          amount: amt,
          dueDate: instDueDate,
          paidDate: instPaidDate || null,
          paymentMethod: instPaidDate ? instMethod : null,
          referenceId: instPaidDate ? instRef : null,
          notes: instNotes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setInstError(json.error || `Error ${res.status}`); return; }
      setEditingInst(null);
      router.refresh();
    } catch (err) {
      setInstError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSavingInst(false);
    }
  }

  // ── Derived values ────────────────────────────────────────────
  const effectiveEmail = email || ownerEmailState;
  const waLink   = phone ? `https://wa.me/91${phone.replace(/\D/g, "")}` : null;
  const mailLink = effectiveEmail ? `mailto:${effectiveEmail}` : null;
  const callLink = phone ? `tel:+91${phone.replace(/\D/g, "")}` : null;

  const amountPaid    = paymentPlan?.installments.reduce((s, i) => s + (i.paid_date ? i.amount : 0), 0) ?? 0;
  const amountPending = paymentPlan ? paymentPlan.total_amount - amountPaid : 0;
  const progressPct   = paymentPlan ? Math.min(Math.round((amountPaid / paymentPlan.total_amount) * 100), 100) : 0;

  return (
    <div className="space-y-3">

      {/* ── License key ─────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl p-5">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1.5">License Key</p>
        <code className="text-brand-cyan font-mono text-base font-bold tracking-wider block mb-4">{licenseKey}</code>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyKey}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all"
          >
            {copied ? <Check size={14} className="text-brand-emerald" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={`/invoice/${encodeURIComponent(licenseKey)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan text-sm font-medium rounded-xl transition-all"
          >
            <Printer size={14} /> Print Invoice
          </a>
          <button
            onClick={sendInvoice}
            disabled={sendingMail || !effectiveEmail}
            title={!effectiveEmail ? "Add an email address first" : "Send invoice to customer email"}
            className="flex items-center gap-2 px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mailSent
              ? <><Check size={14} className="text-emerald-400" /> Sent!</>
              : <><SendHorizonal size={14} /> {sendingMail ? "Sending…" : "Send Email"}</>}
          </button>
        </div>
        {mailSent && (
          <p className="text-xs text-emerald-400 mt-2">Invoice sent to {mailSent}</p>
        )}
        {mailError && (
          <p className="text-xs text-red-400 mt-2">{mailError}</p>
        )}
      </div>

      {/* ── Status toggle ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">License Status</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isActive ? "This license is active and working" : "This license is suspended"}
          </p>
        </div>
        <button
          onClick={toggleStatus}
          disabled={toggling}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 border"
          style={isActive
            ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }
            : { background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}
        >
          {isActive ? <><ToggleRight size={16} /> Suspend</> : <><ToggleLeft size={16} /> Activate</>}
        </button>
      </div>

      {/* ── Convert Trial Plan ──────────────────────────────── */}
      {licenseType === "trial" && (
        <div className="bg-white border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle size={16} className="text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900">Upgrade Plan</h3>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Trial</span>
          </div>

          {convertTarget ? (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">
                  Convert to {convertTarget === "yearly" ? "1 Year Plan" : "Lifetime Plan"}?
                </p>
                <p className="text-slate-500">
                  {convertTarget === "yearly"
                    ? "License type will change to Yearly and expiry will be set to 1 year from today."
                    : "License type will change to Lifetime and expiry date will be removed."}
                </p>
              </div>
              {convertError && <ErrorBox message={convertError} />}
              <div className="flex items-center gap-2">
                <button
                  onClick={convertPlan}
                  disabled={converting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <Check size={14} /> {converting ? "Converting…" : "Yes, Convert"}
                </button>
                <button
                  onClick={() => { setConvertTarget(null); setConvertError(null); }}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-3">This is a trial license. Select a plan to upgrade it to:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setConvertTarget("yearly"); setConvertError(null); }}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all text-blue-700"
                >
                  <ArrowUpCircle size={20} />
                  <span className="text-sm font-bold">1 Year Plan</span>
                  <span className="text-xs font-normal text-blue-500">Expires in 365 days</span>
                </button>
                <button
                  onClick={() => { setConvertTarget("lifetime"); setConvertError(null); }}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 transition-all text-emerald-700"
                >
                  <ArrowUpCircle size={20} />
                  <span className="text-sm font-bold">Lifetime Plan</span>
                  <span className="text-xs font-normal text-emerald-500">Never expires</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete license ───────────────────────────────────── */}
      <div className="bg-white border border-red-100 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Delete License</p>
          <p className="text-xs text-slate-400 mt-0.5">Permanently removes this license and all its data</p>
        </div>
        {confirmDeleteLicense ? (
          <div className="flex items-center gap-2">
            <button
              onClick={deleteLicense}
              disabled={deletingLicense}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deletingLicense ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDeleteLicense(false)}
              className="px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteLicense(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all"
          >
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>

      {/* ── AI Credits ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">AI Credits</h3>
          </div>
          {!editingCredits && (
            <button
              onClick={() => { setCreditsInput(String(aiCreditsTotal)); setCreditsError(null); setEditingCredits(true); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:text-brand-navy/70 transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {editingCredits ? (
          <div className="space-y-3">
            <div>
              <input
                type="number"
                min={0}
                step={1}
                value={creditsInput}
                onChange={(e) => setCreditsInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                placeholder="e.g. 100"
              />
              {creditsError && <p className="text-xs text-red-500 mt-1">{creditsError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveCredits}
                disabled={savingCredits}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-xl hover:bg-brand-navy/90 transition-all disabled:opacity-50"
              >
                <Save size={13} /> {savingCredits ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditingCredits(false); setCreditsError(null); }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-navy">{aiCreditsTotal}</span>
              <span className="text-sm text-slate-400">credits purchased</span>
            </div>
            {aiCredits !== aiCreditsTotal && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-600">{aiCredits}</span> remaining
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── AI Label Scans ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-violet-500" />
            <h3 className="text-sm font-bold text-slate-900">AI Label Scans</h3>
          </div>
          {!editingScans && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setScansInput(String(labelScansUsed)); setScansError(null); setEditingScans(true); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:text-brand-navy/70 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={resetLabelScans}
                disabled={resettingScans || scansResetDone}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors disabled:opacity-40"
                title="Remove all label scan credits (set remaining to 0)"
              >
                <RotateCcw size={12} />
                {resettingScans ? "Resetting…" : scansResetDone ? "Reset!" : "Reset Counter"}
              </button>
            </div>
          )}
        </div>

        {editingScans ? (
          <div className="space-y-3">
            <div>
              <input
                type="number"
                min={0}
                step={1}
                value={scansInput}
                onChange={(e) => setScansInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder="e.g. 300"
              />
              {scansError && <p className="text-xs text-red-500 mt-1">{scansError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveScansCount}
                disabled={savingScans}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-all disabled:opacity-50"
              >
                <Save size={13} /> {savingScans ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditingScans(false); setScansError(null); }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${labelScansUsed <= 0 ? "text-red-500" : labelScansUsed <= 10 ? "text-amber-500" : "text-violet-600"}`}>
                {labelScansUsed}
              </span>
              <span className="text-sm text-slate-400">scans remaining</span>
            </div>
            {labelScansUsed <= 0 && (
              <p className="text-xs text-red-500 font-semibold">Credits exhausted — pharmacy cannot scan labels.</p>
            )}
            <p className="text-xs text-slate-400">Use Edit to top up credits. Each label OCR scan via phone camera deducts 1 credit.</p>
          </div>
        )}
      </div>

      {/* ── Contact info ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-900">Contact Info</p>
          {!editingContact
            ? <button
                onClick={() => setEditingContact(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-navy hover:text-white transition-all"
              >
                <Pencil size={12} /> Edit
              </button>
            : <button
                onClick={() => setEditingContact(false)}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"
              >
                <X size={12} /> Cancel
              </button>
          }
        </div>
        {editingContact ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Owner Email <span className="text-red-500">*</span>
              </label>
              <input type="email" value={ownerEmailState} onChange={(e) => setOwnerEmailState(e.target.value)}
                placeholder="owner@pharmacy.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Same as owner email if blank"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
              <p className="text-[10px] text-slate-400 mt-1 ml-0.5">Used for invoices. Defaults to owner email if blank.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
            </div>
            <button onClick={saveContact} disabled={savingContact || !ownerEmailState.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all">
              <Save size={14} /> {savingContact ? "Saving…" : "Save Contact"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {ownerEmailState && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} className="text-slate-300 shrink-0" />
                <span className="truncate">{ownerEmailState}</span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">(owner)</span>
              </div>
            )}
            {email && email !== ownerEmailState && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} className="text-slate-300 shrink-0" />
                <span className="truncate">{email}</span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0">(contact)</span>
              </div>
            )}
            {!ownerEmailState && (
              <div className="flex items-center gap-2 text-sm text-slate-300 italic">
                <Mail size={14} className="shrink-0" /> No email saved
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone size={14} className="text-slate-300 shrink-0" />
              {phone || <span className="text-slate-300 italic">No phone saved</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <a href={callLink ?? "#"}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm font-semibold transition-all ${callLink ? "bg-white border-slate-200 text-slate-700 hover:border-brand-navy hover:text-brand-navy" : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none"}`}>
          <Phone size={18} /> Call
        </a>
        <a href={waLink ?? "#"} target="_blank" rel="noopener noreferrer"
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm font-semibold transition-all ${waLink ? "bg-white border-slate-200 text-slate-700 hover:border-green-500 hover:text-green-600" : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none"}`}>
          <MessageCircle size={18} /> WhatsApp
        </a>
        <a href={mailLink ?? "#"}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm font-semibold transition-all ${mailLink ? "bg-white border-slate-200 text-slate-700 hover:border-violet-500 hover:text-violet-600" : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none"}`}>
          <Mail size={18} /> Email
        </a>
      </div>

      {/* ── Activated Machines ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-900">
              Activated Machines
              <span className="ml-2 text-xs font-normal text-slate-400">
                {activatedMachines.length} / {maxMachines}
              </span>
            </p>
          </div>
          {activatedMachines.length > 0 && (
            <button
              onClick={() => removeMachine(null)}
              disabled={removingMachine === "all"}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <XCircle size={12} /> {removingMachine === "all" ? "Clearing…" : "Clear all"}
            </button>
          )}
        </div>
        {activatedMachines.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Not activated on any machine yet.</p>
        ) : (
          <div className="space-y-2">
            {activatedMachines.map((m, i) => (
              <div key={i} className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield size={13} className="text-slate-300 shrink-0" />
                  <div className="min-w-0">
                    <code className="font-mono text-xs text-slate-600 block">{m.machine_id}</code>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Activated {m.activated_at ? new Date(m.activated_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeMachine(m.machine_id)}
                  disabled={removingMachine === m.machine_id}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-200 transition-all disabled:opacity-50"
                >
                  <X size={11} /> {removingMachine === m.machine_id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Payment section ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-900">Payment</p>
          </div>
          <div className="flex items-center gap-3">
            {!paymentPlan && !showCreateForm && (
              <button onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:text-brand-navy/80 transition-colors">
                <Plus size={13} /> Add Payment Plan
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!paymentPlan && !showCreateForm && (
          <p className="text-sm text-slate-400 italic">No payment plan attached yet.</p>
        )}

        {/* ── Create form ───────────────────────────────────── */}
        {showCreateForm && !paymentPlan && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Payment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_TYPE_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setNewPayType(value)}
                    className={`text-xs font-semibold px-2 py-2 rounded-xl border transition-all ${newPayType === value ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-slate-600 border-slate-200 hover:border-brand-navy"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Base Amount (₹) *</label>
                <input type="number" value={newBaseAmount} onChange={(e) => setNewBaseAmount(e.target.value)} placeholder="e.g. 12712"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">GST Rate</label>
                <GstSelect value={newGstRate} onChange={setNewGstRate} />
              </div>
            </div>
            {newBaseAmount && !isNaN(parseFloat(newBaseAmount)) && (
              <GstSummary base={parseFloat(newBaseAmount)} rate={parseFloat(newGstRate) || 0} />
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                {newPayType === "one_time" ? "Payment Date" : "First Installment Date"}
              </label>
              <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (optional)</label>
              <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. negotiated price"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
            </div>

            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} className="mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    {newPayType === "one_time" ? "Already collected" : "First instalment already collected"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {newPayType === "one_time" ? "Tick if customer has already paid the full amount" : "Tick if today's first EMI is already in hand"}
                  </p>
                </div>
              </label>
              {alreadyPaid && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <MethodSelect value={firstMethod} onChange={setFirstMethod} />
                  <input type="text" value={firstRef} onChange={(e) => setFirstRef(e.target.value)} placeholder="Reference (optional)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" />
                </div>
              )}
            </div>

            {createError && <ErrorBox message={createError} />}

            <div className="flex gap-2">
              <button onClick={createPayment} disabled={creating || !newBaseAmount}
                className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all">
                <Save size={14} /> {creating ? "Creating…" : "Create Plan"}
              </button>
              <button onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Existing plan ─────────────────────────────────── */}
        {paymentPlan && (
          <div className="space-y-4">
            {/* Source + delete row */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                paymentPlan.payment_source === "razorpay_online" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
              }`}>
                {paymentPlan.payment_source === "razorpay_online"
                  ? <><Globe size={11} /> Online (Razorpay)</>
                  : <><Wallet size={11} /> Offline (Manual)</>}
              </span>
              <div className="flex items-center gap-3">
                {paymentPlan.payment_source !== "razorpay_online" && (
                  <button onClick={() => { setEditingPlan(true); setEditPayType(paymentPlan.payment_type); setEditBaseAmount(String(paymentPlan.base_amount ?? paymentPlan.total_amount)); setEditGstRate(String(paymentPlan.gst_rate ?? "0")); setEditNotes(paymentPlan.notes ?? ""); setPlanError(null); }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-navy transition-colors">
                    <Pencil size={12} /> Edit plan
                  </button>
                )}
                <button onClick={deletePayment} disabled={deleting}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
                  <Trash2 size={12} /> {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>

            {/* ── Edit plan inline form ──────────────────────── */}
            {editingPlan ? (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">Edit Payment Plan</p>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Payment Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_TYPE_OPTIONS.map(({ value, label }) => (
                      <button key={value} onClick={() => setEditPayType(value)}
                        className={`text-xs font-semibold px-2 py-2 rounded-xl border transition-all ${editPayType === value ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-slate-600 border-slate-200 hover:border-brand-navy"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Base Amount (₹) *</label>
                    <input type="number" value={editBaseAmount} onChange={(e) => setEditBaseAmount(e.target.value)} placeholder="e.g. 12712"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">GST Rate</label>
                    <GstSelect value={editGstRate} onChange={setEditGstRate} />
                  </div>
                </div>
                {editBaseAmount && !isNaN(parseFloat(editBaseAmount)) && (
                  <GstSummary base={parseFloat(editBaseAmount)} rate={parseFloat(editGstRate) || 0} />
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (optional)</label>
                  <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="e.g. negotiated price"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy bg-white" />
                </div>
                {planError && <ErrorBox message={planError} />}
                <div className="flex gap-2">
                  <button onClick={savePlan} disabled={savingPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all">
                    <Save size={14} /> {savingPlan ? "Saving…" : "Save Changes"}
                  </button>
                  <button onClick={() => { setEditingPlan(false); setPlanError(null); }}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Summary strip ────────────────────────────── */
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {PAYMENT_TYPE_LABELS[paymentPlan.payment_type]}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    amountPending <= 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"
                  }`}>
                    {amountPending <= 0 ? "Fully Paid" : "Pending"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <AmountCell label="Total"   amount={paymentPlan.total_amount} color="text-slate-800" />
                  <AmountCell label="Paid"    amount={amountPaid}               color="text-emerald-600" />
                  <AmountCell label="Pending" amount={amountPending}            color={amountPending > 0 ? "text-red-500" : "text-slate-400"} />
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-slate-400 text-right">{progressPct}% collected</p>
              </div>
            )}

            {/* ── Installments ──────────────────────────────── */}
            {!editingPlan && (
              <div className="space-y-2">
                {paymentPlan.installments.map((inst) => (
                  <InstallmentRow
                    key={inst.id}
                    inst={inst}
                    onEdit={() => openEditInst(inst)}
                    readonly={paymentPlan.payment_source === "razorpay_online"}
                  />
                ))}
                {paymentPlan.notes && (
                  <p className="text-xs text-slate-400 italic pt-1">{paymentPlan.notes}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Installment Modal ────────────────────────────── */}
      {editingInst && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Instalment {editingInst.installment_number}
              </h3>
              <button onClick={() => setEditingInst(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Amount (₹)</label>
                  <input type="number" value={instAmount} onChange={(e) => setInstAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Due Date</label>
                  <input type="date" value={instDueDate} onChange={(e) => setInstDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Paid Date <span className="font-normal text-slate-400">(leave blank = not yet paid)</span>
                </label>
                <input type="date" value={instPaidDate} onChange={(e) => setInstPaidDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                {instPaidDate && (
                  <button onClick={() => { setInstPaidDate(""); setInstRef(""); }}
                    className="mt-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                    ✕ Clear — mark as not paid
                  </button>
                )}
              </div>

              {instPaidDate && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Payment Method</label>
                    <MethodSelect value={instMethod} onChange={setInstMethod} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Reference ID (optional)</label>
                    <input type="text" value={instRef} onChange={(e) => setInstRef(e.target.value)} placeholder="UPI ref, cheque no…"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Notes (optional)</label>
                <input type="text" value={instNotes} onChange={(e) => setInstNotes(e.target.value)} placeholder="Any note"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy" />
              </div>
            </div>

            {instError && <ErrorBox message={instError} />}

            <div className="flex gap-2 pt-1">
              <button onClick={saveInstallment} disabled={savingInst}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all">
                <Save size={15} /> {savingInst ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditingInst(null)}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function InstallmentRow({
  inst, onEdit, readonly,
}: {
  inst: PaymentInstallment;
  onEdit: () => void;
  readonly: boolean;
}) {
  const isPaid    = !!inst.paid_date;
  const isOverdue = !isPaid && new Date(inst.due_date) < new Date();

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${
      isPaid ? "bg-emerald-50" : isOverdue ? "bg-red-50" : "bg-slate-50"
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {isPaid
          ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          : <Clock size={14} className={`shrink-0 ${isOverdue ? "text-red-400" : "text-slate-300"}`} />
        }
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700">
            Instalment {inst.installment_number}
            <span className="ml-2 font-normal text-slate-400">
              ₹{Math.round(inst.amount).toLocaleString("en-IN")}
            </span>
          </p>
          <p className={`text-xs mt-0.5 ${isOverdue && !isPaid ? "text-red-400 font-medium" : "text-slate-400"}`}>
            {isPaid
              ? `Paid on ${inst.paid_date}`
              : `Due ${inst.due_date}${isOverdue ? " · Overdue" : ""}`}
          </p>
          {isPaid && inst.payment_method && (
            <p className="text-xs text-slate-400">
              via {METHOD_LABELS[inst.payment_method] ?? inst.payment_method}
              {inst.reference_id ? ` · ${inst.reference_id}` : ""}
            </p>
          )}
        </div>
      </div>

      {!readonly && (
        <button onClick={onEdit}
          className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-brand-navy hover:text-brand-navy transition-all">
          <Pencil size={11} /> Edit
        </button>
      )}
    </div>
  );
}

function AmountCell({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color} flex items-center justify-center gap-0.5`}>
        <IndianRupee size={11} />
        {Math.round(amount).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

const GST_OPTIONS = [
  { value: "0",  label: "None (0%)" },
  { value: "5",  label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

function GstSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy bg-white">
      {GST_OPTIONS.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}

function GstSummary({ base, rate }: { base: number; rate: number }) {
  const gstAmt = Math.round(base * rate / 100);
  const total  = base + gstAmt;
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs space-y-1">
      <div className="flex justify-between text-slate-500">
        <span>Base Amount</span>
        <span className="font-semibold text-slate-700">₹{Math.round(base).toLocaleString("en-IN")}</span>
      </div>
      {rate > 0 && (
        <div className="flex justify-between text-slate-500">
          <span>GST ({rate}%)</span>
          <span className="font-semibold text-slate-700">₹{gstAmt.toLocaleString("en-IN")}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-bold">
        <span>Total</span>
        <span>₹{total.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

function MethodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy bg-white">
      {METHOD_OPTIONS.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-600 font-medium">{message}</p>
    </div>
  );
}
