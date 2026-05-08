"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  ShieldCheck,
  Infinity as InfinityIcon,
  RefreshCw,
  Star,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Typewriter ─────────────────────────────────────────────────── */
const WORDS = ["POS Billing", "GST Reports", "Inventory Mgmt", "Expiry Alerts", "Profit Tracking"];

function Typewriter() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[idx];
    if (!deleting && text === word) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % WORDS.length);
      return;
    }
    const t = setTimeout(
      () => setText(deleting ? text.slice(0, -1) : word.slice(0, text.length + 1)),
      deleting ? 35 : 75
    );
    return () => clearTimeout(t);
  }, [text, deleting, idx]);

  return (
    <span className="gradient-text whitespace-nowrap">
      {text}
      <span className="inline-block w-0.5 h-[0.85em] bg-brand-cyan ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

/* ─── Animated counter ───────────────────────────────────────────── */
function useCounter(target: number, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let current = 0;
      const step = target / 60;
      const id = setInterval(() => {
        current = Math.min(current + step, target);
        setVal(Math.round(current));
        if (current >= target) clearInterval(id);
      }, 22);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return val;
}

/* ─── App Mockup ─────────────────────────────────────────────────── */
const BARS = [58, 74, 49, 88, 65, 92, 71];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface SidebarItem { Icon: LucideIcon; active: boolean; }
const SIDEBAR_ITEMS: SidebarItem[] = [
  { Icon: TrendingUp, active: true },
  { Icon: Package, active: false },
  { Icon: Receipt, active: false },
  { Icon: AlertTriangle, active: false },
];

function AppMockup() {
  const sales = useCounter(24680, 300);
  const stock = useCounter(847, 400);

  return (
    <div className="relative w-full max-w-[460px] mx-auto select-none">
      {/* Glow halo */}
      <div className="absolute inset-0 bg-brand-cyan/15 blur-3xl rounded-3xl scale-110" />

      {/* Window */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="relative rounded-2xl border border-white/10 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 border-b border-white/10 backdrop-blur-sm">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <span className="text-white/30 text-[11px] font-mono mx-auto pr-10">
            ShelfCure — Dashboard
          </span>
        </div>

        {/* Body */}
        <div className="flex bg-slate-900">
          {/* Sidebar */}
          <div className="w-10 bg-slate-950/60 border-r border-white/5 flex flex-col items-center py-3 gap-2.5">
            {SIDEBAR_ITEMS.map(({ Icon, active }, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  active ? "bg-brand-cyan/20 text-brand-cyan" : "text-white/25"
                }`}
              >
                <Icon size={13} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                Today&apos;s Summary
              </span>
              <span className="text-white/20 text-[9px]">05 May 2026</span>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Sales", value: `₹${sales.toLocaleString("en-IN")}`, sub: "↑ 12%", color: "text-brand-emerald" },
                { label: "Medicines", value: String(stock), sub: "in stock", color: "text-brand-cyan" },
                { label: "Expiring", value: "3", sub: "this week", color: "text-red-400" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-white/5 rounded-xl p-2.5">
                  <div className="text-white/35 text-[9px] mb-1">{label}</div>
                  <div className={`font-bold text-[13px] font-mono ${color}`}>{value}</div>
                  <div className={`text-[8px] mt-0.5 opacity-60 ${color}`}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-white/35 text-[9px] mb-2.5 font-semibold">Weekly Sales</div>
              <div className="flex items-end gap-1.5 h-12">
                {BARS.map((h, i) => (
                  <div key={i} className="flex-1 flex items-end" style={{ height: "100%" }}>
                    <motion.div
                      className="w-full rounded-sm"
                      style={{
                        height: `${h}%`,
                        background:
                          i === 5
                            ? "linear-gradient(to top, #0EA5E9, #38BDF8)"
                            : "rgba(255,255,255,0.12)",
                        transformOrigin: "bottom",
                      }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.6 + i * 0.07, duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1">
                {DAYS.map((d, i) => (
                  <span
                    key={i}
                    className={`flex-1 text-center text-[8px] ${
                      i === 5 ? "text-brand-cyan" : "text-white/20"
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent bill row */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <div className="w-5 h-5 rounded-full bg-brand-emerald/20 flex items-center justify-center flex-shrink-0">
                <Receipt size={9} className="text-brand-emerald" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/50 text-[9px] truncate">Bill #2041 · Rahul Sharma</div>
              </div>
              <div className="text-brand-emerald text-[10px] font-bold">₹840</div>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-brand-emerald flex-shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-950/60 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
            <span className="text-white/25 text-[9px]">Connected · Offline-first</span>
          </div>
          <span className="text-white/20 text-[9px] ml-auto">v2.1.0</span>
        </div>
      </motion.div>

      {/* Floating card — profit */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute -top-5 -right-6 bg-white rounded-2xl shadow-2xl px-3.5 py-2.5 flex items-center gap-2.5"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-brand-emerald/10 rounded-xl flex items-center justify-center">
            <TrendingUp size={14} className="text-brand-emerald" />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-medium">Profit Today</div>
            <div className="text-base font-bold text-brand-emerald leading-tight">₹4,320</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card — alert */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-2xl px-3.5 py-2.5 flex items-center gap-2.5"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
            <AlertTriangle size={14} className="text-red-500" />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-medium">Expiry Alert</div>
            <div className="text-base font-bold text-slate-700 leading-tight">3 medicines</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card — GST */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="absolute top-1/2 -right-10 -translate-y-1/2 bg-white rounded-2xl shadow-2xl px-3.5 py-2.5 flex items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, -4, 4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-brand-navy/10 rounded-xl flex items-center justify-center">
            <Zap size={14} className="text-brand-navy" />
          </div>
          <div>
            <div className="text-[9px] text-slate-400 font-medium">GSTR1</div>
            <div className="text-sm font-bold text-brand-navy leading-tight">Ready ✓</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */
interface Badge { icon: LucideIcon; label: string; }
const badges: Badge[] = [
  { icon: ShieldCheck, label: "Lifetime License" },
  { icon: InfinityIcon, label: "No Subscription" },
  { icon: RefreshCw, label: "Free Updates" },
];

const stats = [
  { value: "100+", label: "Pharmacies" },
  { value: "₹50L+", label: "Processed" },
  { value: "4.9★", label: "Rating" },
];

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const blob1X = useTransform(mouseX, [0, 1], [-30, 30]);
  const blob1Y = useTransform(mouseY, [0, 1], [-30, 30]);
  const blob2X = useTransform(mouseX, [0, 1], [30, -30]);
  const blob2Y = useTransform(mouseY, [0, 1], [30, -30]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden gradient-hero"
    >
      {/* Parallax blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ x: blob1X, y: blob1Y }}
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-brand-cyan/10 blur-3xl"
        />
        <motion.div
          style={{ x: blob2X, y: blob2Y }}
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-brand-emerald/10 blur-3xl"
        />
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-brand-navy-light/10 blur-3xl" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: text ── */}
          <div className="text-center lg:text-left">
            {/* Top badge */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse-slow" />
              Made for Indian Pharmacies 🇮🇳 · GST-Ready
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight"
            >
              Smart <Typewriter />
              <br />
              <span className="text-white/85">for Your Pharmacy</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 text-base sm:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Complete offline-first pharmacy software — POS billing, inventory,
              purchase tracking, GSTR1 export &amp; profit reports. Pay once, use forever.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-5"
            >
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="text-xl font-extrabold text-white">{value}</div>
                  <div className="text-white/40 text-xs">{label}</div>
                </div>
              ))}
              <div className="h-8 w-px bg-white/15 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {["RK", "PS", "MA"].map((initials) => (
                    <div
                      key={initials}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-cyan to-brand-emerald border-2 border-white/30 flex items-center justify-center text-[9px] font-bold text-white"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-0.5 text-yellow-400 ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} fill="currentColor" />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              <Link
                href="/checkout"
                className="relative w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-emerald text-white font-bold text-base rounded-xl shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-brand-emerald/50 overflow-hidden"
              >
                {/* Shine sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
                Buy Lifetime License
                <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-sm font-semibold">
                  ₹9,440
                </span>
              </Link>
              <Link
                href="/trial"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold text-base rounded-xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                Try Free 7 Days →
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-2"
            >
              {badges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-white/8 border border-white/15 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-white/75 text-xs font-medium"
                >
                  <Icon size={12} className="text-brand-emerald" />
                  {label}
                </div>
              ))}
              <span className="text-white/30 text-xs pl-1">· EMI available · GST invoice</span>
            </motion.div>

            {/* Pricing hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-4 text-white/35 text-xs text-center lg:text-left"
            >
              ₹8,000 + 18% GST = ₹9,440 · One-time payment · 3 &amp; 6 month EMI available
            </motion.div>
          </div>

          {/* ── Right: mockup ── */}
          <div className="lg:pl-8 hidden sm:block">
            <AppMockup />
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 80L1440 80L1440 40C1200 80 800 0 480 40C200 70 0 40 0 40L0 80Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
