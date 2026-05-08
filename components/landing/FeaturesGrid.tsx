"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Package,
  FileText,
  TrendingUp,
  Users,
  Truck,
  Scan,
  MessageCircle,
  Bell,
  BarChart3,
  RefreshCcw,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  bg: string;
  glowColor: string;
  hoverBorder: string;
  hoverShadow: string;
  category: string;
  tag?: string;
  tagColor?: string;
  stat: string;
  featured?: boolean;
}

const features: Feature[] = [
  {
    icon: ShoppingCart,
    title: "Fast POS Billing",
    desc: "Lightning-fast point-of-sale with barcode scanner support, keyboard shortcuts, and split payment modes.",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    glowColor: "rgba(14,165,233,0.12)",
    hoverBorder: "border-brand-cyan/40",
    hoverShadow: "shadow-brand-cyan/15",
    category: "Billing",
    tag: "Most Used",
    tagColor: "bg-brand-cyan/10 text-brand-cyan",
    stat: "< 10 sec per bill",
    featured: true,
  },
  {
    icon: Package,
    title: "Inventory Management",
    desc: "Real-time stock tracking, batch management, expiry alerts, and negative stock prevention.",
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
    glowColor: "rgba(16,185,129,0.12)",
    hoverBorder: "border-brand-emerald/40",
    hoverShadow: "shadow-brand-emerald/15",
    category: "Inventory",
    tag: "Essential",
    tagColor: "bg-brand-emerald/10 text-brand-emerald",
    stat: "Real-time tracking",
    featured: true,
  },
  {
    icon: FileText,
    title: "GST-Ready Billing",
    desc: "Auto GST calculation, GSTR1 export to Excel, HSN code support, and GST invoice generation.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    glowColor: "rgba(139,92,246,0.12)",
    hoverBorder: "border-violet-400/40",
    hoverShadow: "shadow-violet-500/15",
    category: "Billing",
    tag: "GST Compliant",
    tagColor: "bg-violet-500/10 text-violet-500",
    stat: "1-click GSTR1 export",
    featured: true,
  },
  {
    icon: Truck,
    title: "Purchase Management",
    desc: "Full purchase entry with supplier management, challan tracking, and purchase return processing.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    glowColor: "rgba(249,115,22,0.12)",
    hoverBorder: "border-orange-400/40",
    hoverShadow: "shadow-orange-500/15",
    category: "Inventory",
    stat: "Supplier ledgers",
  },
  {
    icon: TrendingUp,
    title: "Profit & Sales Reports",
    desc: "Detailed profit reports, daily/monthly sales summaries, and expiry stock reports at your fingertips.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    glowColor: "rgba(236,72,153,0.12)",
    hoverBorder: "border-pink-400/40",
    hoverShadow: "shadow-pink-500/15",
    category: "Reports",
    stat: "Daily / Monthly view",
  },
  {
    icon: Users,
    title: "Customer Management",
    desc: "Customer credit tracking, purchase history, sale returns, and customer ledger management.",
    color: "text-brand-navy",
    bg: "bg-brand-navy/10",
    glowColor: "rgba(30,58,138,0.12)",
    hoverBorder: "border-brand-navy/40",
    hoverShadow: "shadow-brand-navy/15",
    category: "Billing",
    stat: "Credit & ledger",
  },
  {
    icon: Scan,
    title: "AI Bill Scanning",
    desc: "Scan purchase bills using your phone camera. AI extracts items automatically — no manual typing.",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    glowColor: "rgba(14,165,233,0.12)",
    hoverBorder: "border-brand-cyan/40",
    hoverShadow: "shadow-brand-cyan/15",
    category: "Smart",
    tag: "AI-Powered",
    tagColor: "bg-brand-cyan/10 text-brand-cyan",
    stat: "Auto data extraction",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Billing",
    desc: "Share bills directly via WhatsApp to your customers with one tap — no printing needed.",
    color: "text-brand-emerald",
    bg: "bg-brand-emerald/10",
    glowColor: "rgba(16,185,129,0.12)",
    hoverBorder: "border-brand-emerald/40",
    hoverShadow: "shadow-brand-emerald/15",
    category: "Smart",
    stat: "1-tap sharing",
  },
  {
    icon: BarChart3,
    title: "Dashboard & Analytics",
    desc: "Live dashboard with revenue charts, low stock alerts, expiry warnings, and today's summary.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    glowColor: "rgba(139,92,246,0.12)",
    hoverBorder: "border-violet-400/40",
    hoverShadow: "shadow-violet-500/15",
    category: "Reports",
    stat: "Live revenue charts",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Automatic alerts for low stock, expiring medicines, and pending challans so nothing slips through.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    glowColor: "rgba(249,115,22,0.12)",
    hoverBorder: "border-orange-400/40",
    hoverShadow: "shadow-orange-500/15",
    category: "Smart",
    stat: "Zero missed alerts",
  },
  {
    icon: RefreshCcw,
    title: "Sale & Purchase Returns",
    desc: "Complete return management with credit notes, refund tracking, and stock adjustment.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    glowColor: "rgba(236,72,153,0.12)",
    hoverBorder: "border-pink-400/40",
    hoverShadow: "shadow-pink-500/15",
    category: "Inventory",
    stat: "Credit notes auto-gen",
  },
  {
    icon: Shield,
    title: "Offline-First & Secure",
    desc: "Works without internet. All data stored locally on your computer — your data stays with you.",
    color: "text-brand-navy",
    bg: "bg-brand-navy/10",
    glowColor: "rgba(30,58,138,0.12)",
    hoverBorder: "border-brand-navy/40",
    hoverShadow: "shadow-brand-navy/15",
    category: "Smart",
    tag: "100% Private",
    tagColor: "bg-brand-navy/10 text-brand-navy",
    stat: "No cloud dependency",
  },
];

const TABS = ["All", "Billing", "Inventory", "Reports", "Smart"];

/* ─── Per-card glow on mouse move ────────────────────────────────── */
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      ref={cardRef}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative bg-white rounded-2xl p-6 border transition-all duration-300 overflow-hidden cursor-default ${
        hovered
          ? `border-slate-200 ${feature.hoverShadow} shadow-xl -translate-y-1`
          : "border-slate-100 shadow-sm"
      } ${feature.featured ? "sm:row-span-1" : ""}`}
    >
      {/* Mouse spotlight */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(220px circle at ${mouse.x}px ${mouse.y}px, ${feature.glowColor}, transparent)`,
        }}
      />

      {/* Hover border glow */}
      <div
        className={`absolute inset-0 rounded-2xl pointer-events-none border-2 transition-opacity duration-300 ${feature.hoverBorder}`}
        style={{ opacity: hovered ? 1 : 0 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          animate={hovered ? { scale: 1.1, rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
        >
          <feature.icon size={20} className={feature.color} />
        </motion.div>

        {/* Tag */}
        {feature.tag && (
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${feature.tagColor}`}>
            {feature.tag}
          </span>
        )}

        <h3 className="font-semibold text-slate-900 text-base mb-2 leading-tight">{feature.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>

        {/* Stat line — slides up on hover */}
        <motion.div
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${feature.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${feature.bg} border ${feature.hoverBorder}`} />
          {feature.stat}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Section ────────────────────────────────────────────────────── */
export default function FeaturesGrid() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All" ? features : features.filter((f) => f.category === activeTab);

  return (
    <section id="features" className="bg-slate-50/60 py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            Everything You Need
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Built for the Modern Indian Pharmacy
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            From POS billing to GST filing — ShelfCure handles it all so you can focus on serving
            your customers.
          </p>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm"
          >
            {[
              { n: "12", label: "core features" },
              { n: "100+", label: "pharmacies trust us" },
              { n: "1", label: "one-time payment" },
              { n: "∞", label: "lifetime updates" },
            ].map(({ n, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-slate-500">
                <span className="font-extrabold text-slate-800 text-base">{n}</span>
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300"
              }`}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full gradient-brand"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {tab}
              {tab !== "All" && (
                <span className={`ml-1.5 text-xs ${activeTab === tab ? "opacity-70" : "opacity-40"}`}>
                  {features.filter((f) => f.category === tab).length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-14 text-center"
        >
          <p className="text-slate-400 text-sm">
            All features included in the lifetime license — no hidden add-ons, no subscription tiers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
