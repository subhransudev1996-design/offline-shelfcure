"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Pencil, X, Save, MapPin, AlertCircle } from "lucide-react";

interface Props {
  licenseKey: string;
  pharmacyName: string;
  ownerName: string;
  address: string;
  gstNumber: string;
  drugLicense: string;
}

export default function StoreInfoCard({
  licenseKey,
  pharmacyName: nameProp,
  ownerName: ownerProp,
  address: addressProp,
  gstNumber: gstProp,
  drugLicense: dlProp,
}: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(nameProp);
  const [owner, setOwner] = useState(ownerProp);
  const [address, setAddress] = useState(addressProp);
  const [gst, setGst] = useState(gstProp);
  const [dl, setDl] = useState(dlProp);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/licenses/update-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey,
          pharmacyName: name,
          ownerName: owner,
          address,
          gstNumber: gst,
          drugLicense: dl,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || "Failed to save"); return; }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Store size={16} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Store Info</h3>
        </div>
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setError(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-navy hover:text-white transition-all"
          >
            <Pencil size={12} /> Edit
          </button>
        ) : (
          <button
            onClick={() => { setEditing(false); setError(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <X size={12} /> Cancel
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Field label="Pharmacy Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ABC Medical Store"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy"
            />
          </Field>
          <Field label="Owner Name">
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Rajesh Kumar"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy"
            />
          </Field>
          <Field label="Address">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop no., Street, City, State — PIN"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy resize-none"
            />
          </Field>
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Legal Details</p>
            <Field label="GST Number">
              <input
                type="text"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy font-mono"
              />
            </Field>
            <Field label="Drug License Number">
              <input
                type="text"
                value={dl}
                onChange={(e) => setDl(e.target.value)}
                placeholder="DL-20-000001"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy font-mono"
              />
            </Field>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:bg-brand-navy/90 transition-all"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {name ? (
            <p className="text-sm font-semibold text-slate-800">{name}</p>
          ) : (
            <p className="text-sm text-slate-300 italic">No pharmacy name set</p>
          )}
          {owner && (
            <div className="text-sm text-slate-600">
              <span className="text-xs text-slate-400 font-medium block mb-0.5">Owner</span>
              {owner}
            </div>
          )}
          {address && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-300 shrink-0 mt-0.5" />
              <p className="leading-relaxed whitespace-pre-line">{address}</p>
            </div>
          )}
          {(gst || dl) && (
            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              {gst && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">GST</span>
                  <code className="font-mono text-slate-700">{gst}</code>
                </div>
              )}
              {dl && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Drug License</span>
                  <code className="font-mono text-slate-700">{dl}</code>
                </div>
              )}
            </div>
          )}
          {!name && !owner && !address && !gst && !dl && (
            <p className="text-xs text-slate-400 italic">Click Edit to add store details</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}
