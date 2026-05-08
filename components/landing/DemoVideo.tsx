"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  ShoppingCart,
  Package,
  FileText,
  MessageCircle,
  BarChart3,
  Clock,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const VIDEO_ID = "vEWPumKysk8";

interface Chapter {
  start: number;
  time: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  color: string;
  bg: string;
}

const CHAPTERS: Chapter[] = [
  {
    start: 0,
    time: "0:00",
    label: "Dashboard Overview",
    icon: BarChart3,
    desc: "Live stats, revenue chart, low-stock & expiry alerts at a glance.",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
  },
  {
    start: 35,
    time: "0:35",
    label: "Fast POS Billing",
    icon: ShoppingCart,
    desc: "Barcode scan, auto GST, split payments — bill created in under 10 seconds.",
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
  },
  {
    start: 70,
    time: "1:10",
    label: "Inventory & Expiry",
    icon: Package,
    desc: "Batch-level stock, expiry alerts, and negative-stock prevention.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    start: 105,
    time: "1:45",
    label: "GSTR1 Export",
    icon: FileText,
    desc: "One-click GST report export to Excel ready for filing.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    start: 140,
    time: "2:20",
    label: "WhatsApp Billing",
    icon: MessageCircle,
    desc: "Send the bill to your customer via WhatsApp — no printing needed.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

/* ─── Animated dashboard thumbnail ──────────────────────────────── */
function useCounter(target: number, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let c = 0;
      const step = target / 60;
      const id = setInterval(() => {
        c = Math.min(c + step, target);
        setVal(Math.round(c));
        if (c >= target) clearInterval(id);
      }, 20);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

const BARS = [52, 68, 44, 85, 60, 95, 70];

function DashboardPreview() {
  const sales = useCounter(38420, 200);
  const stock = useCounter(1243, 350);
  const bills = useCounter(47, 500);

  const RECENT = [
    { name: "Paracetamol 500mg", qty: "2 strips", amount: "₹48" },
    { name: "Metformin 850mg", qty: "1 strip", amount: "₹62" },
    { name: "Cetirizine 10mg", qty: "3 strips", amount: "₹36" },
  ];

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <div className="w-12 bg-slate-950/80 border-r border-white/5 flex flex-col items-center py-4 gap-3 flex-shrink-0">
        {[TrendingUp, ShoppingCart, Package, FileText, Receipt].map((Icon, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              i === 0 ? "bg-brand-cyan/20 text-brand-cyan" : "text-white/20"
            }`}
          >
            <Icon size={14} />
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-white/70 text-xs font-semibold">Good morning 👋</div>
            <div className="text-white/30 text-[9px]">ShelfCure Dashboard · 05 May 2026</div>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-brand-emerald"
            />
            <span className="text-white/30 text-[9px]">Live</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2 flex-shrink-0">
          {[
            { label: "Sales Today", value: `₹${sales.toLocaleString("en-IN")}`, color: "text-brand-emerald", trend: "↑ 14%" },
            { label: "Medicines", value: String(stock), color: "text-brand-cyan", trend: "in stock" },
            { label: "Bills Today", value: String(bills), color: "text-violet-400", trend: "transactions" },
          ].map(({ label, value, color, trend }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2.5">
              <div className="text-white/35 text-[8px] mb-1">{label}</div>
              <div className={`font-bold text-sm font-mono leading-none ${color}`}>{value}</div>
              <div className={`text-[8px] mt-1 opacity-60 ${color}`}>{trend}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-1 min-h-0">
          {/* Bar chart */}
          <div className="bg-white/5 rounded-xl p-3 flex flex-col flex-1 min-w-0">
            <div className="text-white/30 text-[8px] font-semibold mb-2">Weekly Revenue</div>
            <div className="flex items-end gap-1 flex-1">
              {BARS.map((h, i) => (
                <div key={i} className="flex-1 flex items-end" style={{ height: "100%" }}>
                  <motion.div
                    className="w-full rounded-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 5
                          ? "linear-gradient(to top, #0EA5E9, #38BDF8)"
                          : "rgba(255,255,255,0.1)",
                      transformOrigin: "bottom",
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.35, ease: "easeOut" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent bills */}
          <div className="bg-white/5 rounded-xl p-3 flex flex-col w-44 flex-shrink-0">
            <div className="text-white/30 text-[8px] font-semibold mb-2">Recent Bills</div>
            <div className="space-y-1.5">
              {RECENT.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-white/50 text-[8px] truncate">{r.name}</div>
                    <div className="text-white/25 text-[7px]">{r.qty}</div>
                  </div>
                  <div className="text-brand-emerald text-[9px] font-bold ml-1 flex-shrink-0">
                    {r.amount}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-auto pt-2 flex items-center gap-1 border-t border-white/5">
              <AlertTriangle size={8} className="text-orange-400 flex-shrink-0" />
              <span className="text-orange-400/80 text-[7px]">3 expiring soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main section ───────────────────────────────────────────────── */
export default function DemoVideo() {
  const [playing, setPlaying] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [hoveringPlay, setHoveringPlay] = useState(false);

  function playFrom(start: number, idx: number) {
    setStartAt(start);
    setActiveChapter(idx);
    setPlaying(true);
  }

  return (
    <section id="demo" className="bg-slate-900 py-20 md:py-28 overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-brand-cyan/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-brand-emerald/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            Live Demo
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            See ShelfCure in Action
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">
            Watch how easily you can manage your entire pharmacy — billing, inventory, reports — all in one place.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-slate-500 text-sm">
            <Clock size={13} />
            <span>3 min watch time · 5 workflows covered</span>
          </div>
        </motion.div>

        {/* App window chrome + video */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
        >
          {/* Chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-md px-3 py-1 mx-6">
              <span className="text-slate-400 text-xs font-mono block text-center">
                ShelfCure — Pharmacy Management System
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
              <span className="text-slate-400 text-xs hidden sm:inline">v2.1.0</span>
            </div>
          </div>

          {/* Video / Thumbnail */}
          <div className="relative" style={{ aspectRatio: "16/9" }}>
            <AnimatePresence mode="wait">
              {playing ? (
                <motion.iframe
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&start=${startAt}`}
                  title="ShelfCure Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <motion.div
                  key="thumbnail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {/* Animated dashboard */}
                  <DashboardPreview />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" />

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => playFrom(0, 0)}
                      onMouseEnter={() => setHoveringPlay(true)}
                      onMouseLeave={() => setHoveringPlay(false)}
                      aria-label="Play demo video"
                      className="relative flex flex-col items-center gap-4 group"
                    >
                      {/* Pulsing rings */}
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-brand-emerald/30"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.9], opacity: [0.25, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                          className="absolute inset-0 rounded-full bg-brand-emerald/20"
                        />
                        <motion.div
                          animate={hoveringPlay ? { scale: 1.1 } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/15 border-2 border-white/40 backdrop-blur-md flex items-center justify-center shadow-2xl"
                        >
                          <Play
                            size={36}
                            className="text-white ml-1"
                            fill="currentColor"
                          />
                        </motion.div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold text-base">Watch Full Demo</div>
                        <div className="text-white/50 text-sm flex items-center justify-center gap-1.5 mt-0.5">
                          <Clock size={11} />
                          3 minutes
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Chapter pills overlay — bottom */}
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-4">
                    {CHAPTERS.map((ch, i) => (
                      <motion.button
                        key={ch.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        onClick={() => playFrom(ch.start, i)}
                        className="hidden sm:flex items-center gap-1.5 bg-black/50 hover:bg-black/70 border border-white/10 hover:border-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full text-white/60 hover:text-white text-[10px] font-medium transition-all"
                      >
                        <span className="text-white/40">{ch.time}</span>
                        {ch.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Chapter cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {CHAPTERS.map((ch, i) => {
            const isActive = activeChapter === i && playing;
            return (
              <motion.button
                key={ch.label}
                onClick={() => playFrom(ch.start, i)}
                whileHover={{ y: -2 }}
                className={`relative text-left p-3 rounded-xl border transition-all duration-200 overflow-hidden ${
                  isActive
                    ? "bg-white/10 border-white/20 shadow-lg"
                    : "bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-chapter"
                    className="absolute inset-0 bg-brand-cyan/10 rounded-xl"
                  />
                )}
                <div className="relative z-10">
                  <div className={`w-7 h-7 rounded-lg ${ch.bg} flex items-center justify-center mb-2`}>
                    <ch.icon size={13} className={ch.color} />
                  </div>
                  <div className={`text-[9px] font-mono font-bold mb-0.5 ${isActive ? "text-brand-cyan" : "text-white/30"}`}>
                    {ch.time}
                  </div>
                  <div className="text-white/80 text-xs font-semibold leading-tight">{ch.label}</div>
                  <div className="text-white/35 text-[9px] mt-1 leading-snug hidden sm:block">{ch.desc}</div>
                </div>
                {isActive && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-cyan"
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Bottom strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500"
        >
          {[
            { icon: ShoppingCart, text: "POS Billing in < 10 sec" },
            { icon: Package, text: "Batch & expiry tracking" },
            { icon: FileText, text: "GSTR1 in 1 click" },
            { icon: MessageCircle, text: "WhatsApp bill sharing" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-2">
              <Icon size={13} className="text-brand-cyan flex-shrink-0" />
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
