"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, Lock, ChevronLeft, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", gstin: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Valid 10-digit mobile number required";
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin))
      e.gstin = "Invalid GSTIN format";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: "INR",
          order_id: data.orderId,
          name: "ShelfCure",
          description: "Lifetime Pharmacy Software License",
          image: `${window.location.origin}/logo.png`,
          prefill: { name: form.name, email: form.email, contact: `+91${form.phone}` },
          notes: { purchase_id: data.purchaseId, gstin: form.gstin },
          theme: { color: "#1E3A8A" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verify = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                purchase_id: data.purchaseId,
              }),
            });
            const vData = await verify.json();
            if (verify.ok) {
              window.location.href = `/success?license=${encodeURIComponent(vData.licenseKey)}&email=${encodeURIComponent(form.email)}`;
            } else {
              setApiError("Payment verification failed. Please contact support.");
              setLoading(false);
            }
          },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
      };
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm">
            <ChevronLeft size={16} /> Back
          </Link>
          <Image src="/logo.png" alt="ShelfCure" width={120} height={33} className="h-8 w-auto" />
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Lock size={12} /> Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-8">
        {/* Form */}
        <div className="md:col-span-3">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Purchase</h1>
          <p className="text-slate-500 text-sm mb-8">
            Enter your details below to receive your license key by email after payment.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: "name", label: "Full Name", type: "text", placeholder: "Ravi Kumar" },
              { id: "email", label: "Email Address", type: "email", placeholder: "ravi@example.com" },
              { id: "phone", label: "Mobile Number", type: "tel", placeholder: "9876543210" },
            ].map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type={field.type}
                  value={form[field.id as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 outline-none text-sm transition-all bg-white"
                />
                {errors[field.id] && (
                  <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                GSTIN <span className="text-slate-400 font-normal">(optional — for GST credit)</span>
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 outline-none text-sm transition-all bg-white font-mono"
              />
              {errors.gstin && (
                <p className="mt-1 text-xs text-red-500">{errors.gstin}</p>
              )}
            </div>

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-base rounded-xl transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Opening Payment..." : "Proceed to Pay ₹9,440"}
            </button>

            <p className="text-center text-xs text-slate-400">
              🔒 Secure payment via Razorpay · EMI available on bank cards · GST invoice via email
            </p>
          </form>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-900 mb-5">Order Summary</h3>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">ShelfCure Desktop (Lifetime)</span>
                <span className="font-medium">₹8,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST (18%)</span>
                <span className="font-medium">₹1,440</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-brand-navy">₹9,440</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 mb-5">
              {[
                "Lifetime license — pay once",
                "Free updates forever",
                "License key by email",
                "GST tax invoice included",
                "EMI available (3 or 6 months)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle size={13} className="text-brand-emerald shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-xs justify-center">
              <Shield size={12} />
              Secured by Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
