"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Clock, Zap, Shield, Send } from "lucide-react";

const trialFeatures = [
  "Full access to all features for 7 days",
  "POS billing with barcode scanner",
  "Inventory & purchase management",
  "GST billing & reports",
  "No credit card required",
];

export default function TrialPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [telegramLink, setTelegramLink] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Valid 10-digit mobile number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      if (data.trialKey && data.telegramBotUsername) {
        setTelegramLink(`https://t.me/${data.telegramBotUsername}?start=${data.trialKey}`);
      }

      setStatus("success");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
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
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10 items-start">
        {/* Left: Info */}
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <Clock size={12} /> 7-Day Free Trial
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Try ShelfCure Free for 7 Days
          </h1>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Get full access to ShelfCure for 7 days — no credit card, no commitment.
            See exactly how it will work for your pharmacy before you buy.
          </p>

          <div className="space-y-3 mb-8">
            {trialFeatures.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle size={17} className="text-brand-emerald shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{f}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <Zap size={20} className="text-brand-cyan mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">Instant Access</div>
              <div className="text-xs text-slate-400">License key by email</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <Shield size={20} className="text-brand-emerald mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">No Card Required</div>
              <div className="text-xs text-slate-400">Completely free</div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {status === "success" ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-brand-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-brand-emerald" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check Your Email!</h2>
              <p className="text-slate-500 text-sm mb-6">
                We&apos;ve sent your 7-day trial license key and download link to{" "}
                <span className="font-semibold text-slate-700">{form.email}</span>
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm text-slate-600 space-y-2 mb-5">
                <div>1. Download the installer from the email link</div>
                <div>2. Install ShelfCure on your Windows PC</div>
                <div>3. Enter your trial license key to activate</div>
              </div>

              {/* Telegram connect CTA */}
              {telegramLink && (
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 mb-3 bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-bold rounded-xl transition-all"
                >
                  <Send size={17} />
                  Get Setup Help on Telegram
                </a>
              )}

              <Link
                href="/checkout"
                className="block w-full text-center py-3 bg-brand-navy text-white font-bold rounded-xl hover:bg-brand-navy-light transition-all"
              >
                Buy Full License — ₹9,440
              </Link>

              {telegramLink && (
                <p className="text-xs text-slate-400 mt-3">
                  Telegram bot sends setup tips &amp; upgrade reminders during your trial
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Start Your Free Trial</h2>
              <p className="text-slate-400 text-sm mb-6">We&apos;ll send the download link and trial key to your email.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 outline-none text-sm transition-all"
                    />
                    {errors[field.id] && (
                      <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
                    )}
                  </div>
                ))}

                {status === "error" && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {errMsg || "Something went wrong. Please try again."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3.5 bg-brand-navy hover:bg-brand-navy-light text-white font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {status === "loading" ? "Sending..." : "Start Free Trial →"}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Trial lasts 7 days · No payment needed · Automatic expiry
                </p>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Ready to buy?{" "}
            <Link href="/checkout" className="text-brand-navy font-semibold hover:underline">
              Purchase lifetime license →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
