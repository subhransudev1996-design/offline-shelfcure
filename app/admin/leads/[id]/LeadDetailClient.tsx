"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StateSearchSelect from "../StateSearchSelect";
import {
  ArrowLeft, Phone, Mail, MapPin, Edit2, Save, X, Plus, Trash2,
  CheckCircle, Key, PhoneCall, MessageSquare, MapPinned, Monitor,
  ChevronDown, RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Followup {
  id: string;
  lead_id: string;
  type: string;
  notes: string | null;
  outcome: string | null;
  next_followup_date: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  owner_name: string;
  pharmacy_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  source: string;
  status: string;
  license_interest: string | null;
  notes: string | null;
  converted_license_key: string | null;
  created_at: string;
  updated_at: string;
  lead_followups: Followup[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: "new",         label: "New",         cls: "bg-slate-100 text-slate-600"    },
  { value: "contacted",   label: "Contacted",   cls: "bg-blue-100 text-blue-600"      },
  { value: "interested",  label: "Interested",  cls: "bg-amber-100 text-amber-700"    },
  { value: "demo_done",   label: "Demo Done",   cls: "bg-purple-100 text-purple-700"  },
  { value: "negotiating", label: "Negotiating", cls: "bg-orange-100 text-orange-600"  },
  { value: "converted",   label: "Converted",   cls: "bg-emerald-100 text-emerald-700"},
  { value: "lost",        label: "Lost",        cls: "bg-red-100 text-red-500"        },
];

const SOURCES = [
  { value: "cold_call",    label: "Cold Call"    },
  { value: "referral",     label: "Referral"     },
  { value: "website",      label: "Website"      },
  { value: "facebook_ads", label: "Facebook Ads" },
  { value: "google_ads",   label: "Google Ads"   },
  { value: "exhibition",   label: "Exhibition"   },
  { value: "walk_in",      label: "Walk-in"      },
  { value: "other",        label: "Other"        },
];

const INTERESTS = [
  { value: "trial",    label: "Trial"    },
  { value: "yearly",   label: "1 Year"   },
  { value: "lifetime", label: "Lifetime" },
  { value: "unsure",   label: "Not Sure" },
];

const FOLLOWUP_TYPES = [
  { value: "call",      label: "Phone Call", Icon: PhoneCall      },
  { value: "whatsapp",  label: "WhatsApp",   Icon: MessageSquare  },
  { value: "visit",     label: "Visit",      Icon: MapPinned      },
  { value: "email",     label: "Email",      Icon: Mail           },
  { value: "demo",      label: "Demo",       Icon: Monitor        },
];

const OUTCOMES = [
  { value: "interested",      label: "Interested"       },
  { value: "not_interested",  label: "Not Interested"   },
  { value: "callback",        label: "Callback Requested"},
  { value: "demo_scheduled",  label: "Demo Scheduled"   },
  { value: "no_answer",       label: "No Answer"        },
  { value: "closed_won",      label: "Closed (Won)"     },
  { value: "closed_lost",     label: "Closed (Lost)"    },
];


// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusMeta(val: string) {
  return STATUSES.find((s) => s.value === val) ?? { label: val, cls: "bg-slate-100 text-slate-500" };
}

function followupTypeIcon(type: string) {
  return FOLLOWUP_TYPES.find((t) => t.value === type)?.Icon ?? PhoneCall;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-slate-800">{value || <span className="text-slate-300">—</span>}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function LeadDetailClient({ lead: initialLead }: { lead: Lead }) {
  const router = useRouter();
  const [lead, setLead]         = useState<Lead>(initialLead);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Edit form state (mirrors lead fields)
  const [form, setForm] = useState({
    owner_name:       initialLead.owner_name,
    pharmacy_name:    initialLead.pharmacy_name ?? "",
    phone:            initialLead.phone ?? "",
    email:            initialLead.email ?? "",
    address:          initialLead.address ?? "",
    city:             initialLead.city ?? "",
    state:            initialLead.state ?? "",
    source:           initialLead.source,
    status:           initialLead.status,
    license_interest: initialLead.license_interest ?? "",
    notes:            initialLead.notes ?? "",
  });

  // Followup form state
  const [followupOpen, setFollowupOpen] = useState(false);
  const [fpType, setFpType]       = useState("call");
  const [fpNotes, setFpNotes]     = useState("");
  const [fpOutcome, setFpOutcome] = useState("");
  const [fpNextDate, setFpNextDate] = useState("");
  const [fpStatus, setFpStatus]   = useState("");
  const [fpSaving, setFpSaving]   = useState(false);
  const [fpError, setFpError]     = useState("");

  // Convert modal state
  const [convertOpen, setConvertOpen]   = useState(false);
  const [cvType, setCvType]             = useState("yearly");
  const [cvEmail, setCvEmail]           = useState(initialLead.email ?? "");
  const [cvMachines, setCvMachines]     = useState("1");
  const [cvSaving, setCvSaving]         = useState(false);
  const [cvError, setCvError]           = useState("");

  // Status quick-change
  const [statusChanging, setStatusChanging] = useState(false);

  function setF(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // ── Save lead info ──────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.pharmacy_name.trim()) { setError("Pharmacy name required"); return; }
    if (!form.phone.trim()) { setError("Phone required"); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/admin/leads/update", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, ...form,
          license_interest: form.license_interest || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead((l) => ({ ...l, ...form, license_interest: form.license_interest || null }));
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Quick status change ─────────────────────────────────────────────────

  async function handleStatusChange(newStatus: string) {
    if (newStatus === lead.status) return;
    setStatusChanging(true);
    try {
      await fetch("/api/admin/leads/update", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          owner_name: lead.owner_name,
          pharmacy_name: lead.pharmacy_name,
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          source: lead.source,
          status: newStatus,
          license_interest: lead.license_interest,
          notes: lead.notes,
        }),
      });
      setLead((l) => ({ ...l, status: newStatus }));
      setForm((f) => ({ ...f, status: newStatus }));
    } finally {
      setStatusChanging(false);
    }
  }

  // ── Add followup ────────────────────────────────────────────────────────

  async function handleAddFollowup(e: React.FormEvent) {
    e.preventDefault();
    if (!fpNotes.trim()) { setFpError("Notes are required"); return; }
    setFpSaving(true); setFpError("");
    try {
      const res  = await fetch("/api/admin/leads/add-followup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id:            lead.id,
          type:               fpType,
          notes:              fpNotes,
          outcome:            fpOutcome || null,
          next_followup_date: fpNextDate || null,
          update_status:      fpStatus || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const newFollowup: Followup = {
        id:                 json.id,
        lead_id:            lead.id,
        type:               fpType,
        notes:              fpNotes,
        outcome:            fpOutcome || null,
        next_followup_date: fpNextDate || null,
        created_at:         new Date().toISOString(),
      };

      setLead((l) => ({
        ...l,
        lead_followups: [newFollowup, ...l.lead_followups],
        status: fpStatus || l.status,
      }));
      setForm((f) => ({ ...f, status: fpStatus || f.status }));

      // Reset
      setFpType("call"); setFpNotes(""); setFpOutcome(""); setFpNextDate(""); setFpStatus("");
      setFollowupOpen(false);
    } catch (err) {
      setFpError(err instanceof Error ? err.message : "Failed");
    } finally {
      setFpSaving(false);
    }
  }

  // ── Delete followup ─────────────────────────────────────────────────────

  async function handleDeleteFollowup(id: string) {
    if (!confirm("Delete this followup entry?")) return;
    const res = await fetch("/api/admin/leads/delete-followup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setLead((l) => ({ ...l, lead_followups: l.lead_followups.filter((f) => f.id !== id) }));
    }
  }

  // ── Delete lead ─────────────────────────────────────────────────────────

  async function handleDeleteLead() {
    if (!confirm(`Delete lead "${lead.owner_name}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/leads/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id }),
    });
    if (res.ok) router.push("/admin/leads");
  }

  // ── Convert to license ──────────────────────────────────────────────────

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!cvEmail.trim()) { setCvError("Owner email required"); return; }
    setCvSaving(true); setCvError("");
    try {
      const res  = await fetch("/api/admin/leads/convert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id:      lead.id,
          license_type: cvType,
          owner_email:  cvEmail,
          max_machines: cvMachines,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push(`/admin/licenses/${encodeURIComponent(json.licenseKey)}`);
    } catch (err) {
      setCvError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCvSaving(false);
    }
  }

  const sm = statusMeta(lead.status);
  const isConverted = !!lead.converted_license_key;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/leads" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{lead.owner_name}</h1>
            {lead.pharmacy_name && (
              <p className="text-sm text-slate-400 mt-0.5">{lead.pharmacy_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status selector */}
          <div className="relative">
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusChanging || isConverted}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 ${sm.cls} disabled:opacity-60`}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {!isConverted && (
            <button
              onClick={() => { setConvertOpen(true); setCvError(""); }}
              className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Key size={13} />
              Convert to License
            </button>
          )}

          <button
            onClick={handleDeleteLead}
            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-xl hover:bg-red-50"
            title="Delete lead"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {isConverted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Converted to license</span>
          </div>
          <Link
            href={`/admin/licenses/${encodeURIComponent(lead.converted_license_key!)}`}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <Key size={12} /> {lead.converted_license_key}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column: Lead info ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Lead info card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Lead Info</h3>
              {!editMode ? (
                <button
                  onClick={() => { setEditMode(true); setError(""); }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-navy transition-colors"
                >
                  <Edit2 size={12} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditMode(false); setError(""); }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs font-semibold text-white bg-brand-navy px-2.5 py-1 rounded-lg hover:bg-brand-navy/90 disabled:opacity-60"
                  >
                    <Save size={11} /> {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-4">
              {!editMode ? (
                <div className="space-y-3.5">
                  <FieldRow label="Owner" value={lead.owner_name} />
                  <FieldRow label="Pharmacy" value={lead.pharmacy_name} />
                  <FieldRow
                    label="Phone"
                    value={lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-brand-navy hover:underline">
                        <Phone size={12} /> {lead.phone}
                      </a>
                    ) : null}
                  />
                  <FieldRow
                    label="Email"
                    value={lead.email ? (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-brand-navy hover:underline truncate">
                        <Mail size={12} /> {lead.email}
                      </a>
                    ) : null}
                  />
                  <FieldRow
                    label="Location"
                    value={[lead.city, lead.state].filter(Boolean).join(", ") || null}
                  />
                  {lead.address && (
                    <FieldRow
                      label="Address"
                      value={
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                          <span>{lead.address}</span>
                        </div>
                      }
                    />
                  )}
                  <FieldRow label="Source" value={SOURCES.find((s) => s.value === lead.source)?.label ?? lead.source} />
                  <FieldRow
                    label="Interest"
                    value={lead.license_interest
                      ? <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {INTERESTS.find((i) => i.value === lead.license_interest)?.label ?? lead.license_interest}
                        </span>
                      : null}
                  />
                  {lead.notes && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</div>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{lead.notes}</p>
                    </div>
                  )}
                  <div className="pt-1 text-xs text-slate-400 border-t border-slate-100">
                    Added {fmtDate(lead.created_at)}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <InputField label="Owner Name" value={form.owner_name} onChange={(v) => setF("owner_name", v)} placeholder="Dr. Rajesh Kumar" />
                    <InputField label="Pharmacy Name *" value={form.pharmacy_name} onChange={(v) => setF("pharmacy_name", v)} placeholder="Raj Medical" />
                    <InputField label="Phone *" value={form.phone} onChange={(v) => setF("phone", v)} type="tel" placeholder="+91 98765 43210" />
                    <InputField label="Email" value={form.email} onChange={(v) => setF("email", v)} type="email" placeholder="owner@pharmacy.com" />
                    <InputField label="City" value={form.city} onChange={(v) => setF("city", v)} placeholder="Bhubaneswar" />
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
                      <StateSearchSelect value={form.state} onChange={(v) => setF("state", v)} />
                    </div>
                    <InputField label="Address" value={form.address} onChange={(v) => setF("address", v)} placeholder="Shop no., Street" />
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Source</label>
                      <select value={form.source} onChange={(e) => setF("source", e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white">
                        {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">License Interest</label>
                      <select value={form.license_interest} onChange={(e) => setF("license_interest", e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white">
                        <option value="">Not specified</option>
                        {INTERESTS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                      <textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)}
                        rows={3} placeholder="Notes..."
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan resize-none" />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column: Followups ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Add followup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => { setFollowupOpen((o) => !o); setFpError(""); }}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus size={15} className="text-brand-cyan" />
                Log Follow-up Activity
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${followupOpen ? "rotate-180" : ""}`} />
            </button>

            {followupOpen && (
              <form onSubmit={handleAddFollowup} className="px-5 pb-5 space-y-4 border-t border-slate-100">
                <div className="pt-4 grid grid-cols-2 gap-3">
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Activity Type</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {FOLLOWUP_TYPES.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFpType(value)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                            fpType === value
                              ? "bg-brand-navy text-white border-brand-navy"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <Icon size={12} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outcome */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Outcome</label>
                    <select value={fpOutcome} onChange={(e) => setFpOutcome(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white">
                      <option value="">Select outcome</option>
                      {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notes *</label>
                  <textarea
                    value={fpNotes}
                    onChange={(e) => setFpNotes(e.target.value)}
                    rows={3}
                    placeholder="What was discussed? Any objections, requirements, or feedback..."
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Next followup date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={fpNextDate}
                      onChange={(e) => setFpNextDate(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                    />
                  </div>

                  {/* Update status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Update Lead Status</label>
                    <select value={fpStatus} onChange={(e) => setFpStatus(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan bg-white">
                      <option value="">Keep current ({statusMeta(lead.status).label})</option>
                      {STATUSES.filter((s) => s.value !== "converted").map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {fpError && <p className="text-sm text-red-500 font-medium">{fpError}</p>}

                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setFollowupOpen(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={fpSaving}
                    className="flex items-center gap-1.5 bg-brand-navy text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-navy/90 transition-colors disabled:opacity-60">
                    <RefreshCw size={13} />
                    {fpSaving ? "Saving..." : "Log Activity"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Followup timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Activity Timeline
                {lead.lead_followups.length > 0 && (
                  <span className="ml-2 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {lead.lead_followups.length}
                  </span>
                )}
              </h3>
            </div>

            <div className="divide-y divide-slate-50">
              {lead.lead_followups.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No activity logged yet. Log your first follow-up above.
                </div>
              ) : (
                lead.lead_followups.map((fu) => {
                  const TypeIcon = followupTypeIcon(fu.type);
                  const isOverdueNext = fu.next_followup_date && fu.next_followup_date < new Date().toISOString().split("T")[0];
                  const isTodayNext   = fu.next_followup_date === new Date().toISOString().split("T")[0];

                  return (
                    <div key={fu.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                          <TypeIcon size={14} className="text-brand-navy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-700 capitalize">
                                {FOLLOWUP_TYPES.find((t) => t.value === fu.type)?.label ?? fu.type}
                              </span>
                              {fu.outcome && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {OUTCOMES.find((o) => o.value === fu.outcome)?.label ?? fu.outcome}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteFollowup(fu.id)}
                              className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                              title="Delete this entry"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {fu.notes && (
                            <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{fu.notes}</p>
                          )}

                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs text-slate-400">{fmtDateTime(fu.created_at)}</span>
                            {fu.next_followup_date && (
                              <span className={`text-xs font-medium ${
                                isTodayNext ? "text-amber-600" : isOverdueNext ? "text-red-500" : "text-slate-500"
                              }`}>
                                Next: {isTodayNext ? "Today" : isOverdueNext ? `Overdue (${fmtDate(fu.next_followup_date)})` : fmtDate(fu.next_followup_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Convert to License modal ── */}
      {convertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setConvertOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Convert to License</h2>
              </div>
              <button onClick={() => setConvertOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConvert} className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-500">
                Creating a new license for <strong className="text-slate-700">{lead.owner_name}</strong>
                {lead.pharmacy_name ? ` · ${lead.pharmacy_name}` : ""}.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">License Type *</label>
                <div className="flex gap-2">
                  {["trial", "yearly", "lifetime"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCvType(t)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors capitalize ${
                        cvType === t
                          ? "bg-brand-navy text-white border-brand-navy"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {t === "yearly" ? "1 Year" : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Owner Email *</label>
                <input
                  type="email"
                  value={cvEmail}
                  onChange={(e) => setCvEmail(e.target.value)}
                  placeholder="owner@pharmacy.com"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Max Machines</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={cvMachines}
                  onChange={(e) => setCvMachines(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
                />
              </div>

              {cvError && <p className="text-sm text-red-500 font-medium">{cvError}</p>}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setConvertOpen(false)}
                  className="text-sm text-slate-500 font-medium hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={cvSaving}
                  className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60">
                  <Key size={13} />
                  {cvSaving ? "Creating..." : "Create License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
