"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, Copy, Check, Trash2, Mail, X, Send, AlertCircle } from "lucide-react";

export default function LicenseActions({
  licenseKey,
  isActive,
  pharmacyName,
}: {
  licenseKey: string;
  isActive: boolean;
  pharmacyName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [email, setEmail] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [sendingPayment, setSendingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function sendPayment() {
    setPaymentError(null);
    setPaymentSuccess(false);
    
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setPaymentError("Please enter a valid email address");
      return;
    }
    if (!paymentLink.trim() || !paymentLink.startsWith("http")) {
      setPaymentError("Please enter a valid Razorpay link starting with http");
      return;
    }

    setSendingPayment(true);
    try {
      const res = await fetch("/api/admin/licenses/send-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pharmacyName, paymentLink }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPaymentError(json.error || `Error ${res.status}`);
        return;
      }
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setEmail("");
        setPaymentLink("");
        setPaymentSuccess(false);
      }, 2000);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSendingPayment(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy transition-colors placeholder:text-slate-300";

  async function toggleStatus() {
    setLoading(true);
    await fetch("/api/admin/licenses/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, isActive: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  async function deleteLicense() {
    setDeleting(true);
    await fetch("/api/admin/licenses/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    router.refresh();
    setDeleting(false);
    setConfirmDelete(false);
  }

  function copyKey() {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPaymentModal(true)}
          title="Send Payment Link"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-navy transition-all"
        >
          <Mail size={14} />
        </button>
        <button
          onClick={copyKey}
          title="Copy license key"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
        >
          {copied ? <Check size={14} className="text-brand-emerald" /> : <Copy size={14} />}
        </button>
        <button
        onClick={toggleStatus}
        disabled={loading}
        title={isActive ? "Suspend license" : "Activate license"}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-all disabled:opacity-50"
      >
        {isActive
          ? <ToggleRight size={18} className="text-brand-emerald" />
          : <ToggleLeft size={18} className="text-slate-400" />
        }
      </button>

      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <button
            onClick={deleteLicense}
            disabled={deleting}
            className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          title="Delete license"
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Send Payment Link</h2>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setEmail("");
                  setPaymentLink("");
                  setPaymentError(null);
                  setPaymentSuccess(false);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-left">
              {paymentSuccess ? (
                <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium text-center">
                  Payment link sent successfully!
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Customer Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@email.com"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Razorpay Link</label>
                    <input
                      type="url"
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      placeholder="https://rzp.io/l/..."
                      className={inputCls}
                    />
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
                      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-medium">{paymentError}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!paymentSuccess && (
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={sendPayment}
                  disabled={sendingPayment}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy/90 disabled:opacity-60"
                >
                  <Send size={14} /> {sendingPayment ? "Sending..." : "Send Email"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
