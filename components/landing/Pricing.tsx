"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Infinity,
  RefreshCw,
  Shield,
  FileText,
  HeadphonesIcon,
  Zap,
} from "lucide-react";

const included = [
  { icon: Infinity, text: "One-time payment — no monthly subscription" },
  { icon: RefreshCw, text: "All standard updates free for lifetime" },
  { icon: FileText, text: "GST invoice included (₹1,440 GST credit)" },
  { icon: Shield, text: "Lifetime license — yours forever" },
  { icon: HeadphonesIcon, text: "Email & WhatsApp support" },
  { icon: Zap, text: "Works offline — no internet required" },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            One Price. Forever.
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            No subscriptions. No hidden fees. Pay once, use for life.
          </p>
        </motion.div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Top banner */}
          <div className="gradient-hero px-8 pt-8 pb-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand-cyan/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-brand-emerald/20 border border-brand-emerald/30 px-3 py-1 rounded-full text-brand-emerald-light text-xs font-bold mb-3">
                    ✦ LIFETIME LICENSE
                  </div>
                  <h3 className="text-2xl font-bold">ShelfCure Desktop</h3>
                  <p className="text-white/70 text-sm mt-1">Complete Pharmacy Management Software</p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="flex items-start justify-end gap-1">
                    <span className="text-white/60 text-lg mt-2">₹</span>
                    <span className="text-5xl font-extrabold">9,440</span>
                  </div>
                  <div className="text-white/60 text-xs mt-1 space-y-0.5">
                    <div>₹8,000 + ₹1,440 GST (18%)</div>
                    <div className="text-brand-emerald-light font-medium">One-time · No renewal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* What's included */}
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
              Everything included
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {included.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-emerald/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-brand-emerald" strokeWidth={3} />
                  </div>
                  <span className="text-slate-600 text-sm">{text}</span>
                </div>
              ))}
            </div>

            {/* EMI section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-slate-700">EMI Available</span>
                <span className="bg-brand-cyan/10 text-brand-cyan text-xs font-bold px-2 py-0.5 rounded-full">Bank Cards</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">3 Month EMI</div>
                  <div className="font-bold text-slate-900">~₹3,147<span className="text-slate-400 font-normal text-xs">/mo</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">via bank card</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">6 Month EMI</div>
                  <div className="font-bold text-slate-900">~₹1,574<span className="text-slate-400 font-normal text-xs">/mo</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">via bank card</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                * EMI processed by your bank via Razorpay. Interest charges (if any) applied by bank.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/checkout"
                className="flex-1 text-center py-4 px-6 bg-brand-navy hover:bg-brand-navy-light text-white font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Buy Now — ₹9,440
              </Link>
              <Link
                href="/trial"
                className="flex-1 text-center py-4 px-6 border-2 border-slate-200 hover:border-brand-navy text-slate-700 hover:text-brand-navy font-semibold text-base rounded-xl transition-all"
              >
                Try Free 7 Days
              </Link>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              🔒 Secure payment via Razorpay · GST invoice via email · Instant license delivery
            </p>
          </div>
        </motion.div>

        {/* Compare to competition */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 grid grid-cols-3 gap-4 text-center"
        >
          {[
            { label: "Others", price: "₹2,000–5,000/yr", note: "Annual subscription", red: true },
            { label: "ShelfCure", price: "₹9,440", note: "One-time · Lifetime", green: true },
            { label: "Custom Dev", price: "₹50,000+", note: "Plus maintenance", red: true },
          ].map((c) => (
            <div
              key={c.label}
              className={`rounded-2xl border p-4 ${
                c.green
                  ? "border-brand-emerald bg-brand-emerald/5"
                  : "border-slate-200 bg-white opacity-70"
              }`}
            >
              <div className={`text-xs font-bold mb-1 ${c.green ? "text-brand-emerald" : "text-slate-400"}`}>
                {c.label}
              </div>
              <div className={`font-bold text-sm ${c.green ? "text-slate-900" : "text-slate-500"}`}>
                {c.price}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{c.note}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
