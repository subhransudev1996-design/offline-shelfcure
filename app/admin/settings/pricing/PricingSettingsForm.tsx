"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle2, Monitor, Smartphone, Sparkles, Camera } from "lucide-react";

type PaymentType = "one_time" | "3_month_emi" | "6_month_emi";

interface Settings {
  desktop_base_amount: number;
  desktop_gst_rate: number;
  desktop_gst_inclusive: boolean;
  desktop_default_payment_type: PaymentType;
  mobile_base_amount: number;
  mobile_gst_rate: number;
  mobile_gst_inclusive: boolean;
  ai_credits_included: number;
  label_scans_included: number;
}

const GST_OPTIONS = ["0", "5", "12", "18", "28"];

const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: "one_time", label: "One-time" },
  { value: "3_month_emi", label: "3-Month EMI" },
  { value: "6_month_emi", label: "6-Month EMI" },
];

export default function PricingSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Desktop card */}
      <Card icon={<Monitor size={16} className="text-brand-navy" />} title="Desktop Software">
        <Grid>
          <Field label="Base Amount (₹)">
            <input
              type="number"
              min={0}
              value={s.desktop_base_amount}
              onChange={(e) => set("desktop_base_amount", Number(e.target.value))}
              placeholder="e.g. 12000"
              className={inputCls}
            />
          </Field>
          <Field label="GST Rate">
            <select
              value={String(s.desktop_gst_rate)}
              onChange={(e) => set("desktop_gst_rate", Number(e.target.value))}
              className={inputCls + " bg-white"}
            >
              {GST_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g === "0" ? "None (0%)" : `${g}%`}
                </option>
              ))}
            </select>
          </Field>
        </Grid>

        <Toggle
          label="Amount includes GST"
          hint={
            s.desktop_gst_inclusive
              ? "Above amount is treated as the GST-inclusive total — base will be back-calculated."
              : "GST will be added on top of the above base amount."
          }
          checked={s.desktop_gst_inclusive}
          onChange={(v) => set("desktop_gst_inclusive", v)}
        />

        <Field label="Default Payment Type">
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("desktop_default_payment_type", value)}
                className={`text-xs font-semibold px-2 py-2 rounded-xl border transition-all ${
                  s.desktop_default_payment_type === value
                    ? "bg-brand-navy text-white border-brand-navy"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Preview
          base={s.desktop_base_amount}
          rate={s.desktop_gst_rate}
          inclusive={s.desktop_gst_inclusive}
        />
      </Card>

      {/* Mobile card */}
      <Card icon={<Smartphone size={16} className="text-emerald-500" />} title="Mobile Scanner App">
        <p className="text-xs text-slate-400 -mt-1 mb-3">Mobile add-on is one-time only (no EMI).</p>
        <Grid>
          <Field label="Base Amount (₹)">
            <input
              type="number"
              min={0}
              value={s.mobile_base_amount}
              onChange={(e) => set("mobile_base_amount", Number(e.target.value))}
              placeholder="e.g. 500"
              className={inputCls}
            />
          </Field>
          <Field label="GST Rate">
            <select
              value={String(s.mobile_gst_rate)}
              onChange={(e) => set("mobile_gst_rate", Number(e.target.value))}
              className={inputCls + " bg-white"}
            >
              {GST_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g === "0" ? "None (0%)" : `${g}%`}
                </option>
              ))}
            </select>
          </Field>
        </Grid>

        <Toggle
          label="Amount includes GST"
          hint={
            s.mobile_gst_inclusive
              ? "Above amount is treated as the GST-inclusive total — base will be back-calculated."
              : "GST will be added on top of the above base amount."
          }
          checked={s.mobile_gst_inclusive}
          onChange={(v) => set("mobile_gst_inclusive", v)}
        />

        <Preview
          base={s.mobile_base_amount}
          rate={s.mobile_gst_rate}
          inclusive={s.mobile_gst_inclusive}
        />
      </Card>

      </div>

      {/* AI quotas — included with every license */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card icon={<Sparkles size={16} className="text-violet-500" />} title="AI Credits (Included with every license)">
          <p className="text-xs text-slate-400 -mt-1 mb-3">
            The base AI credits a customer receives with their license. This is the amount shown on every invoice.
          </p>
          <Field label="Included Credits per License">
            <input
              type="number"
              min={0}
              step={1}
              value={s.ai_credits_included}
              onChange={(e) => set("ai_credits_included", Number(e.target.value))}
              placeholder="e.g. 50"
              className={inputCls}
            />
          </Field>
        </Card>

        <Card icon={<Camera size={16} className="text-violet-500" />} title="AI Label Scans (Included with every license)">
          <p className="text-xs text-slate-400 -mt-1 mb-3">
            The base AI label-scan credits a customer receives with their license. Each phone-camera label OCR scan uses 1.
          </p>
          <Field label="Included Label Scans per License">
            <input
              type="number"
              min={0}
              step={1}
              value={s.label_scans_included}
              onChange={(e) => set("label_scans_included", Number(e.target.value))}
              placeholder="e.g. 50"
              className={inputCls}
            />
          </Field>
        </Card>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all shadow-sm"
        >
          <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle size={14} /> {error}
          </span>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy transition-colors";

function Card({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Toggle({
  label, hint, checked, onChange,
}: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-brand-navy/40 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-brand-navy"
      />
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
      </div>
    </label>
  );
}

function Preview({ base, rate, inclusive }: { base: number; rate: number; inclusive: boolean }) {
  if (!base || base <= 0) return null;
  const effectiveBase = inclusive ? base / (1 + rate / 100) : base;
  const gstAmt = effectiveBase * rate / 100;
  const total = effectiveBase + gstAmt;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs space-y-1">
      <div className="flex justify-between text-slate-500">
        <span>Base Amount</span>
        <span className="font-semibold text-slate-700">₹{Math.round(effectiveBase).toLocaleString("en-IN")}</span>
      </div>
      {rate > 0 && (
        <div className="flex justify-between text-slate-500">
          <span>GST ({rate}%)</span>
          <span className="font-semibold text-slate-700">₹{Math.round(gstAmt).toLocaleString("en-IN")}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-bold">
        <span>Total</span>
        <span>₹{Math.round(total).toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
