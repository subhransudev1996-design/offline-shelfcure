"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Mail,
  Monitor,
  Check,
  ShieldCheck,
  Download,
  Clock,
  Smartphone,
  RefreshCw,
  Star,
} from "lucide-react";

const STEP_DURATION = 5000;

/* ══════════════════════════════════════════════════════════════════
   MOCKUP 1 — Animated payment form
══════════════════════════════════════════════════════════════════ */
type PayPhase = "form" | "processing" | "success";

function PaymentMockup() {
  const [phase, setPhase] = useState<PayPhase>("form");

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    function cycle() {
      setPhase("form");
      t1 = setTimeout(() => setPhase("processing"), 2800);
      t2 = setTimeout(() => setPhase("success"), 4400);
      t3 = setTimeout(cycle, 7000);
    }
    cycle();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
      {/* Header bar */}
      <div className="bg-brand-navy px-5 py-3.5 flex items-center gap-2">
        <ShieldCheck size={15} className="text-brand-emerald flex-shrink-0" />
        <span className="text-white text-sm font-semibold">Secure Checkout</span>
        <span className="ml-auto text-white/40 text-[10px]">Razorpay</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-5 space-y-4"
          >
            {/* Product row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-800 text-sm">ShelfCure Lifetime</div>
                <div className="text-slate-400 text-xs mt-0.5">₹8,000 + 18% GST</div>
              </div>
              <div className="text-brand-emerald font-extrabold text-xl">₹9,440</div>
            </div>

            {/* Plan selector */}
            <div>
              <div className="text-xs text-slate-500 mb-1.5 font-medium">Payment plan</div>
              <div className="flex gap-1.5">
                {[
                  { label: "Full Pay", sub: "₹9,440", active: true },
                  { label: "3M EMI", sub: "₹3,147/mo", active: false },
                  { label: "6M EMI", sub: "₹1,574/mo", active: false },
                ].map((opt) => (
                  <div
                    key={opt.label}
                    className={`flex-1 text-center py-2 rounded-lg border text-xs transition-colors ${
                      opt.active
                        ? "bg-brand-navy text-white border-brand-navy"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-[9px] opacity-70 mt-0.5">{opt.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="flex gap-1.5">
              {[
                { label: "Card", active: false },
                { label: "UPI", active: true },
                { label: "Net Banking", active: false },
              ].map((m) => (
                <div
                  key={m.label}
                  className={`flex-1 py-1.5 rounded-lg text-xs text-center border ${
                    m.active
                      ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan font-semibold"
                      : "border-slate-100 text-slate-400"
                  }`}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* UPI field */}
            <div className="border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <Smartphone size={13} className="text-slate-300 flex-shrink-0" />
              <span className="text-sm text-slate-600 font-mono">yourname@paytm</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-0.5 h-4 bg-brand-cyan ml-0.5"
              />
            </div>

            {/* Pay button */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full py-3 bg-brand-emerald rounded-xl text-white font-bold text-sm text-center shadow-lg shadow-brand-emerald/30 cursor-pointer"
            >
              Pay ₹9,440 →
            </motion.div>

            <p className="text-center text-slate-400 text-[10px] flex items-center justify-center gap-1">
              <ShieldCheck size={10} className="text-brand-emerald" /> 256-bit SSL · GST invoice included
            </p>
          </motion.div>
        )}

        {phase === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white p-5 flex flex-col items-center justify-center py-14 gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-4 border-brand-cyan/20 border-t-brand-cyan"
            />
            <div>
              <div className="text-slate-700 font-semibold text-sm text-center">Processing payment…</div>
              <div className="text-slate-400 text-xs text-center mt-1">Connecting to Razorpay</div>
            </div>
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((d) => (
                <motion.div
                  key={d}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d }}
                  className="w-1.5 h-1.5 rounded-full bg-brand-cyan"
                />
              ))}
            </div>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white p-5 flex flex-col items-center py-12 gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 280, delay: 0.15 }}
              className="w-16 h-16 rounded-full bg-brand-emerald/10 border-2 border-brand-emerald flex items-center justify-center"
            >
              <Check size={28} className="text-brand-emerald" strokeWidth={3} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center"
            >
              <div className="font-bold text-slate-800 text-base">Payment Successful!</div>
              <div className="text-slate-400 text-xs mt-1">Invoice & license sent to your email</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 text-center"
            >
              <div className="text-[9px] text-slate-400 mb-0.5">Order ID</div>
              <div className="font-mono text-sm font-bold text-brand-navy">SC-20260505-0142</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MOCKUP 2 — License email preview
══════════════════════════════════════════════════════════════════ */
const LICENSE_KEY = "SC-4F2A-9B3C-7D1E-8X6K";

function EmailMockup() {
  const [typed, setTyped] = useState(0);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    function cycle() {
      setTyped(0);
      setShowDownload(false);
      t1 = setTimeout(() => {
        interval = setInterval(() => {
          setTyped((n) => {
            if (n >= LICENSE_KEY.length) {
              clearInterval(interval);
              return n;
            }
            return n + 1;
          });
        }, 60);
      }, 600);
      t2 = setTimeout(() => setShowDownload(true), 600 + LICENSE_KEY.length * 60 + 300);
      t3 = setTimeout(cycle, 5500);
    }
    cycle();
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(interval); };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
      {/* Email client chrome */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <span className="text-xs text-slate-500 font-medium mx-auto">Inbox — Gmail</span>
      </div>

      {/* Email header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-cyan to-brand-emerald flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            SC
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm">🎉 Your ShelfCure License is Ready</div>
            <div className="text-slate-400 text-xs mt-0.5">
              <span className="text-slate-600">support@shelfcure.com</span> → you@gmail.com
            </div>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-slate-700 text-sm">
          Hi there! Your payment was successful. Here&apos;s your lifetime license key:
        </p>

        {/* License key box */}
        <div className="bg-slate-900 rounded-xl px-4 py-3">
          <div className="text-slate-500 text-[9px] uppercase tracking-widest mb-1.5">License Key</div>
          <div className="font-mono text-brand-cyan font-bold text-sm tracking-wider">
            {LICENSE_KEY.slice(0, typed)}
            {typed < LICENSE_KEY.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-brand-cyan align-middle ml-0.5"
              />
            )}
          </div>
        </div>

        {/* Download button */}
        <AnimatePresence>
          {showDownload && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-full py-2.5 bg-brand-emerald rounded-xl text-white text-sm font-bold text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-emerald/25"
              >
                <Download size={14} />
                Download ShelfCure_setup.exe
              </motion.div>
              <p className="text-slate-400 text-[10px] text-center">
                Windows 10/11 · 64-bit · ~45 MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MOCKUP 3 — Install & first bill
══════════════════════════════════════════════════════════════════ */
type InstallPhase = "installing" | "done" | "billing";

function InstallMockup() {
  const [phase, setPhase] = useState<InstallPhase>("installing");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animId: ReturnType<typeof setInterval>;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;

    function cycle() {
      setPhase("installing");
      setProgress(0);
      let p = 0;
      animId = setInterval(() => {
        p += 1.4;
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(animId);
      }, 40);
      t1 = setTimeout(() => setPhase("done"), 3200);
      t2 = setTimeout(() => setPhase("billing"), 4600);
      t3 = setTimeout(cycle, 8000);
    }
    cycle();
    return () => { clearInterval(animId); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
      {/* Window chrome */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <span className="text-xs text-slate-500 mx-auto font-medium">ShelfCure Setup</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "installing" && (
          <motion.div
            key="installing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 space-y-5"
          >
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-cyan flex items-center justify-center shadow-lg">
                <span className="text-white font-extrabold text-xl">Sc</span>
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-800">Installing ShelfCure v2.1.0</div>
                <div className="text-slate-400 text-xs mt-0.5">Pharmacy Management System</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Copying files…</span>
                <span className="font-mono font-semibold text-brand-navy">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-navy to-brand-cyan"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {["Extracting application files", "Configuring database", "Setting up GST modules"].map((step, i) => (
                <div key={step} className={`flex items-center gap-2 text-xs ${progress > (i + 1) * 28 ? "text-brand-emerald" : "text-slate-300"}`}>
                  <Check size={11} strokeWidth={3} />
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 flex flex-col items-center gap-4 py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 280 }}
              className="w-16 h-16 rounded-full bg-brand-emerald/10 border-2 border-brand-emerald flex items-center justify-center"
            >
              <Check size={28} className="text-brand-emerald" strokeWidth={3} />
            </motion.div>
            <div className="text-center">
              <div className="font-bold text-slate-800 text-base">Installation Complete!</div>
              <div className="text-slate-400 text-sm mt-1">ShelfCure is ready to use</div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full py-2.5 bg-brand-navy rounded-xl text-white text-sm font-bold text-center cursor-pointer"
            >
              Launch ShelfCure →
            </motion.div>
          </motion.div>
        )}

        {phase === "billing" && (
          <motion.div
            key="billing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 text-sm">New Bill — #0001</div>
              <div className="flex items-center gap-1 text-brand-emerald text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                Live
              </div>
            </div>

            {/* Bill items */}
            <div className="space-y-1.5 text-xs">
              {[
                { name: "Paracetamol 500mg", qty: "2", price: "₹48.00" },
                { name: "Cetirizine 10mg", qty: "1", price: "₹18.00" },
                { name: "Vitamin D3 60K", qty: "1", price: "₹120.00" },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex justify-between items-center py-1.5 border-b border-slate-50"
                >
                  <span className="text-slate-600">{item.name} × {item.qty}</span>
                  <span className="font-semibold text-slate-800 font-mono">{item.price}</span>
                </motion.div>
              ))}
            </div>

            {/* Totals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs"
            >
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹186.00</span></div>
              <div className="flex justify-between text-slate-500"><span>GST (12%)</span><span>₹22.32</span></div>
              <div className="flex justify-between font-bold text-slate-800 text-sm pt-1 border-t border-slate-200">
                <span>Total</span><span className="text-brand-emerald">₹208.32</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-2"
            >
              <div className="flex-1 py-2 bg-brand-emerald rounded-lg text-white text-xs font-bold text-center">Cash</div>
              <div className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-500 text-xs text-center">UPI</div>
              <div className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-500 text-xs text-center">Card</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STEPS CONFIG
══════════════════════════════════════════════════════════════════ */
const STEPS = [
  {
    num: "01",
    icon: CreditCard,
    title: "Pay Once",
    subtitle: "Secure checkout via Razorpay",
    desc: "Pay in full or choose 3 or 6 month EMI on your bank card. Receive your GST invoice instantly after payment.",
    time: "~2 minutes",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    ring: "ring-brand-cyan/30",
    Mockup: PaymentMockup,
  },
  {
    num: "02",
    icon: Mail,
    title: "Get Your License",
    subtitle: "License key delivered by email",
    desc: "Within minutes, receive your unique license key and the software download link directly in your inbox. No waiting, no approval process.",
    time: "~3 minutes",
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
    ring: "ring-brand-emerald/30",
    Mockup: EmailMockup,
  },
  {
    num: "03",
    icon: Monitor,
    title: "Install & Start Billing",
    subtitle: "Live within 30 minutes",
    desc: "Download, install on Windows, enter your license key, and you're live. Most pharmacies create their first bill within 30 minutes of purchase.",
    time: "~25 minutes",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/30",
    Mockup: InstallMockup,
  },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN SECTION
══════════════════════════════════════════════════════════════════ */
export default function HowItWorks() {
  const [active, setActive] = useState(0);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 3), STEP_DURATION);
    return () => clearInterval(id);
  }, []);

  const ActiveMockup = STEPS[active].Mockup;

  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            Getting Started
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Up and Running in 3 Simple Steps
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            No complex setup. No IT team needed. Most pharmacies are fully operational within 30 minutes.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: Step list ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="space-y-3"
          >
            {STEPS.map((step, i) => {
              const isActive = active === i;
              const isDone = i < active;
              return (
                <button
                  key={step.num}
                  onClick={() => setActive(i)}
                  className={`w-full text-left rounded-2xl border p-5 transition-all duration-300 ${
                    isActive
                      ? "bg-white border-slate-200 shadow-lg ring-2 " + step.ring
                      : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-brand-emerald/10"
                            : isActive
                            ? step.bg
                            : "bg-slate-100"
                        }`}
                      >
                        {isDone ? (
                          <Check size={18} className="text-brand-emerald" strokeWidth={3} />
                        ) : (
                          <step.icon size={18} className={isActive ? step.color : "text-slate-400"} />
                        )}
                      </div>
                      {/* Vertical connector */}
                      {i < 2 && (
                        <div className={`w-0.5 h-4 rounded-full transition-colors ${isDone ? "bg-brand-emerald/40" : "bg-slate-100"}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono font-bold ${isActive ? step.color : "text-slate-300"}`}>
                          {step.num}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {step.time}
                        </span>
                      </div>
                      <h3 className={`font-bold text-base leading-tight ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">{step.subtitle}</p>

                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-slate-500 text-sm leading-relaxed mt-2 overflow-hidden"
                          >
                            {step.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Progress bar under active step */}
                  {isActive && (
                    <div className="mt-3 ml-14 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        key={active}
                        className={`h-full rounded-full ${step.bg.replace("/10", "")}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: STEP_DURATION / 1000, ease: "linear" }}
                        style={{ background: step.color.includes("cyan") ? "#0EA5E9" : step.color.includes("emerald") ? "#10B981" : "#8B5CF6" }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* ── Right: Animated mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative"
          >
            {/* Glow behind mockup */}
            <div className={`absolute inset-0 blur-3xl opacity-20 rounded-3xl scale-90 transition-all duration-700 ${
              active === 0 ? "bg-brand-cyan" : active === 1 ? "bg-brand-emerald" : "bg-violet-500"
            }`} />

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative"
              >
                <ActiveMockup />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-4"
        >
          {[
            { icon: ShieldCheck, text: "Secure Razorpay checkout", color: "text-brand-emerald" },
            { icon: Clock, text: "Live in under 30 minutes", color: "text-brand-cyan" },
            { icon: Monitor, text: "Windows 10 / 11 · 64-bit", color: "text-violet-500" },
            { icon: RefreshCw, text: "Free lifetime updates", color: "text-orange-500" },
            { icon: Star, text: "7-day free trial available", color: "text-yellow-500" },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-2 text-slate-500 text-sm">
              <Icon size={14} className={`${color} flex-shrink-0`} />
              {text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
