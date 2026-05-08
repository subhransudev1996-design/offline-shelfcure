"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ShoppingCart,
  Package,
  Truck,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Scan,
  Download,
  Phone,
  MapPin,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Tab {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

/* ─── Tab data ──────────────────────────────────────────────────────── */
const TABS: Tab[] = [
  {
    id: 0,
    icon: BarChart3,
    title: "Dashboard",
    description: "Live KPIs, revenue chart & alerts at a glance",
  },
  {
    id: 1,
    icon: ShoppingCart,
    title: "POS Billing",
    description: "Fast billing with GST, discount & payment modes",
  },
  {
    id: 2,
    icon: Package,
    title: "Inventory",
    description: "Batch-wise stock, expiry alerts & filters",
  },
  {
    id: 3,
    icon: Truck,
    title: "Purchases",
    description: "Purchase entry with AI bill scanning",
  },
  {
    id: 4,
    icon: FileText,
    title: "Reports",
    description: "GST reports, profit summary & GSTR1 export",
  },
  {
    id: 5,
    icon: Users,
    title: "Suppliers",
    description: "Supplier profiles, ledgers & purchase history",
  },
];

/* ─── Shared AppShell ───────────────────────────────────────────────── */
const NAV_ITEMS = [
  "Dashboard",
  "POS Billing",
  "Inventory",
  "Purchases",
  "Reports",
  "Suppliers",
];

function AppShell({
  activeNav,
  children,
}: {
  activeNav: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-full text-[8px] leading-tight select-none overflow-hidden">
      {/* Sidebar */}
      <div className="w-[72px] shrink-0 bg-[#0f1f5c] flex flex-col py-2 gap-0.5">
        {/* Logo */}
        <div className="px-2 pb-2 mb-1 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-emerald mx-auto flex items-center justify-center">
            <span className="text-white font-bold text-[9px]">Sc</span>
          </div>
        </div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item}
            className={`mx-1 rounded px-1.5 py-1.5 flex flex-col items-center gap-0.5 cursor-default transition-colors ${
              item === activeNav
                ? "bg-white/15 text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <div className="w-3 h-3 rounded bg-current opacity-70" />
            <span className="text-[6px] text-center leading-none">{item.replace(" ", "\n")}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Topbar */}
        <div className="h-7 bg-white border-b border-slate-200 flex items-center px-3 gap-2 shrink-0">
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-800 text-[8px]">{activeNav}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-brand-navy/10 flex items-center justify-center">
              <span className="text-[6px] text-brand-navy font-bold">S</span>
            </div>
            <span className="text-slate-500 text-[7px]">Sharma Ji</span>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-hidden p-2.5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Screen 1 — Dashboard ──────────────────────────────────────────── */
function DashboardScreen() {
  const bars = [52, 68, 44, 85, 60, 95, 70];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const max = Math.max(...bars);

  return (
    <AppShell activeNav="Dashboard">
      <div className="flex flex-col gap-2 h-full">
        <div>
          <p className="font-bold text-slate-800 text-[9px]">Good morning, Sharma Ji 👋</p>
          <p className="text-slate-400 text-[7px]">Sunday, 4 May 2026</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Sales Today", value: "₹38,420", color: "text-brand-emerald", bg: "bg-brand-emerald/10" },
            { label: "Bills Today", value: "47", color: "text-violet-600", bg: "bg-violet-100" },
            { label: "Medicines in Stock", value: "1,243", color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
            { label: "Pending Returns", value: "3", color: "text-orange-500", bg: "bg-orange-100" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg p-1.5 border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[6px] leading-none mb-0.5">{kpi.label}</p>
              <p className={`font-bold text-[10px] ${kpi.color}`}>{kpi.value}</p>
              <div className={`mt-0.5 h-0.5 rounded-full ${kpi.bg}`} />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
          {/* Bar chart */}
          <div className="col-span-2 bg-white rounded-lg border border-slate-100 shadow-sm p-2 flex flex-col min-h-0">
            <p className="text-[7px] font-semibold text-slate-700 mb-1.5">Weekly Revenue</p>
            <div className="flex items-end gap-1 flex-1">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t-sm ${i === 5 ? "bg-brand-cyan" : "bg-brand-navy/20"}`}
                    style={{ height: `${(h / max) * 100}%` }}
                  />
                  <span className="text-[5px] text-slate-400">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-1.5 flex flex-col gap-1">
            <p className="text-[7px] font-semibold text-slate-700 flex items-center gap-0.5">
              <AlertTriangle className="w-2 h-2 text-orange-400" />
              Alerts
            </p>
            {[
              { text: "Paracetamol 500mg — Expiring in 5 days", color: "bg-orange-400" },
              { text: "Metformin 850mg — Low Stock (12 left)", color: "bg-red-400" },
              { text: "Supplier payment due tomorrow", color: "bg-yellow-400" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-1">
                <div className={`w-1 h-1 rounded-full ${a.color} mt-0.5 shrink-0`} />
                <p className="text-[6px] text-slate-600 leading-tight">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Screen 2 — POS Billing ────────────────────────────────────────── */
function POSBillingScreen() {
  const items = [
    { name: "Paracetamol 500mg", qty: 2, price: "₹48.00" },
    { name: "Amoxicillin 250mg", qty: 1, price: "₹85.00" },
    { name: "Cetirizine 10mg", qty: 3, price: "₹36.00" },
    { name: "Vitamin D3 60K", qty: 1, price: "₹120.00" },
  ];

  return (
    <AppShell activeNav="POS Billing">
      <div className="flex gap-2 h-full">
        {/* Left — Bill items */}
        <div className="flex-[3] flex flex-col gap-1.5 min-w-0">
          {/* Search */}
          <div className="bg-white border border-slate-200 rounded-md flex items-center px-2 gap-1 h-6">
            <Scan className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span className="text-[7px] text-slate-400 truncate">Search medicine by name or barcode...</span>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm flex-1 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] text-[6px] text-slate-400 px-2 py-1 border-b border-slate-100 font-semibold uppercase tracking-wide">
              <span>Medicine</span>
              <span className="px-2">Qty</span>
              <span>Amount</span>
            </div>
            {items.map((item, i) => (
              <div key={i} className={`grid grid-cols-[1fr_auto_auto] items-center px-2 py-1.5 ${i < items.length - 1 ? "border-b border-slate-50" : ""}`}>
                <span className="text-[7px] text-slate-700 font-medium truncate">{item.name}</span>
                <div className="flex items-center gap-0.5 px-1">
                  <div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center text-[7px] text-slate-500 font-bold">−</div>
                  <span className="text-[7px] text-slate-700 w-3 text-center">{item.qty}</span>
                  <div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center text-[7px] text-slate-500 font-bold">+</div>
                </div>
                <span className="text-[7px] text-slate-700 font-semibold">{item.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Summary */}
        <div className="flex-[2] flex flex-col gap-1.5 min-w-0">
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-2 flex flex-col gap-1 flex-1">
            <p className="text-[7px] font-semibold text-slate-700 border-b border-slate-100 pb-1">Billing Summary</p>

            {/* Customer */}
            <div className="flex items-center justify-between">
              <span className="text-[6px] text-slate-400">Customer</span>
              <span className="text-[6px] text-slate-600">Walk-in Customer</span>
            </div>

            {[
              { label: "Subtotal", value: "₹289.00" },
              { label: "GST (12%)", value: "₹34.68" },
              { label: "Discount", value: "−₹0.00" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[6px] text-slate-400">{row.label}</span>
                <span className="text-[6px] text-slate-600">{row.value}</span>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-slate-200 pt-1 mt-0.5">
              <span className="text-[7px] font-bold text-slate-800">Total</span>
              <span className="text-[8px] font-extrabold text-brand-navy">₹323.68</span>
            </div>

            {/* Payment buttons */}
            <div className="flex gap-1 mt-1">
              <button className="flex-1 bg-brand-emerald text-white rounded text-[6px] py-1 font-semibold">Cash</button>
              <button className="flex-1 border border-brand-navy/30 text-brand-navy rounded text-[6px] py-1 font-semibold">UPI</button>
              <button className="flex-1 border border-brand-navy/30 text-brand-navy rounded text-[6px] py-1 font-semibold">Card</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Screen 3 — Inventory ──────────────────────────────────────────── */
function InventoryScreen() {
  const rows = [
    { name: "Paracetamol 500mg Strip", batch: "B2401", expiry: "Dec 2025", stock: 124, mrp: "₹2.40", gst: "12%", status: "In Stock", statusColor: "text-brand-emerald bg-brand-emerald/10" },
    { name: "Metformin 850mg Strip", batch: "B2312", expiry: "Mar 2026", stock: 12, mrp: "₹4.20", gst: "12%", status: "Low Stock", statusColor: "text-orange-600 bg-orange-100" },
    { name: "Cetirizine 10mg Strip", batch: "B2309", expiry: "Jun 2024", stock: 0, mrp: "₹3.80", gst: "5%", status: "Expired", statusColor: "text-red-600 bg-red-100" },
    { name: "Amlodipine 5mg Strip", batch: "B2405", expiry: "Aug 2026", stock: 67, mrp: "₹5.10", gst: "12%", status: "In Stock", statusColor: "text-brand-emerald bg-brand-emerald/10" },
    { name: "Vitamin D3 60K", batch: "B2403", expiry: "Jan 2027", stock: 8, mrp: "₹18.00", gst: "5%", status: "Low Stock", statusColor: "text-orange-600 bg-orange-100" },
  ];

  return (
    <AppShell activeNav="Inventory">
      <div className="flex flex-col gap-2 h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-white border border-slate-200 rounded flex items-center px-1.5 h-6">
            <span className="text-[7px] text-slate-400">Search medicines...</span>
          </div>
          <button className="bg-brand-emerald text-white text-[6px] font-semibold px-2 h-6 rounded">+ Add Medicine</button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1">
          {["All", "Low Stock", "Expiring", "Expired"].map((pill, i) => (
            <span key={pill} className={`px-2 py-0.5 rounded-full text-[6px] font-semibold ${i === 0 ? "bg-brand-navy text-white" : "bg-white border border-slate-200 text-slate-500"}`}>
              {pill}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm flex-1 overflow-hidden">
          <div className="grid grid-cols-[2fr_auto_auto_auto_auto_auto_auto] text-[5.5px] text-slate-400 font-semibold uppercase tracking-wide px-2 py-1 border-b border-slate-100">
            <span>Medicine Name</span>
            <span className="px-1">Batch</span>
            <span className="px-1">Expiry</span>
            <span className="px-1">Stock</span>
            <span className="px-1">MRP</span>
            <span className="px-1">GST%</span>
            <span className="px-1">Status</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className={`grid grid-cols-[2fr_auto_auto_auto_auto_auto_auto] items-center px-2 py-1 text-[6px] ${i < rows.length - 1 ? "border-b border-slate-50" : ""}`}>
              <span className="text-slate-700 font-medium truncate">{row.name}</span>
              <span className="text-slate-500 px-1">{row.batch}</span>
              <span className="text-slate-500 px-1">{row.expiry}</span>
              <span className="text-slate-700 font-semibold px-1">{row.stock}</span>
              <span className="text-slate-700 px-1">{row.mrp}</span>
              <span className="text-slate-500 px-1">{row.gst}</span>
              <span className={`px-1 py-0.5 rounded text-[5.5px] font-semibold ml-1 whitespace-nowrap ${row.statusColor}`}>{row.status}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Screen 4 — Purchases ──────────────────────────────────────────── */
function PurchasesScreen() {
  const items = [
    { name: "Paracetamol 500mg", qty: 100, rate: "₹1.80", gst: "12%", amount: "₹180.00" },
    { name: "Cetirizine 10mg", qty: 50, rate: "₹2.20", gst: "5%", amount: "₹110.00" },
    { name: "Metformin 850mg", qty: 80, rate: "₹3.50", gst: "12%", amount: "₹280.00" },
  ];

  return (
    <AppShell activeNav="Purchases">
      <div className="flex flex-col gap-2 h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold text-slate-800">New Purchase Entry</p>
          <button className="border border-brand-cyan text-brand-cyan text-[6px] font-semibold px-2 h-5 rounded flex items-center gap-0.5">
            <Scan className="w-2 h-2" />
            Scan Bill (AI)
          </button>
        </div>

        {/* Form row */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Supplier", value: "Apex Pharma Distributors" },
            { label: "Invoice No.", value: "INV-2041" },
            { label: "Invoice Date", value: "05 May 2026" },
            { label: "Due Date", value: "20 May 2026" },
          ].map((field) => (
            <div key={field.label} className="bg-white border border-slate-200 rounded p-1.5">
              <p className="text-[5.5px] text-slate-400 mb-0.5">{field.label}</p>
              <p className="text-[7px] text-slate-700 font-semibold truncate">{field.value}</p>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm flex-1 overflow-hidden">
          <div className="grid grid-cols-[2fr_auto_auto_auto_auto] text-[5.5px] text-slate-400 font-semibold uppercase tracking-wide px-2 py-1 border-b border-slate-100">
            <span>Medicine</span>
            <span className="px-2">Qty</span>
            <span className="px-2">Rate</span>
            <span className="px-2">GST</span>
            <span className="px-2">Amount</span>
          </div>
          {items.map((row, i) => (
            <div key={i} className={`grid grid-cols-[2fr_auto_auto_auto_auto] items-center px-2 py-1.5 text-[6px] ${i < items.length - 1 ? "border-b border-slate-50" : ""}`}>
              <span className="text-slate-700 font-medium">{row.name}</span>
              <span className="text-slate-600 px-2">{row.qty}</span>
              <span className="text-slate-600 px-2">{row.rate}</span>
              <span className="text-slate-600 px-2">{row.gst}</span>
              <span className="text-slate-700 font-semibold px-2">{row.amount}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex items-center justify-end gap-3 bg-white rounded-lg border border-slate-100 px-3 py-1.5">
          {[
            { label: "Subtotal", value: "₹570.00" },
            { label: "GST", value: "₹68.40" },
          ].map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-[5.5px] text-slate-400">{s.label}</p>
              <p className="text-[7px] text-slate-700 font-semibold">{s.value}</p>
            </div>
          ))}
          <div className="text-right border-l border-slate-200 pl-3">
            <p className="text-[5.5px] text-slate-400">Grand Total</p>
            <p className="text-[9px] font-extrabold text-brand-navy">₹638.40</p>
          </div>
          <button className="bg-brand-emerald text-white text-[6px] font-semibold px-2.5 py-1 rounded ml-2">Save Purchase</button>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Screen 5 — Reports ────────────────────────────────────────────── */
function ReportsScreen() {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const bars = [62, 74, 55, 82, 70, 95];
  const max = Math.max(...bars);

  const topMeds = [
    { name: "Paracetamol 500mg", revenue: "₹42,000" },
    { name: "Metformin 850mg", revenue: "₹28,500" },
    { name: "Cetirizine 10mg", revenue: "₹19,200" },
  ];

  return (
    <AppShell activeNav="Reports">
      <div className="flex flex-col gap-2 h-full">
        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <div className="bg-white border border-slate-200 rounded px-2 h-6 flex items-center">
            <span className="text-[7px] text-slate-600 font-medium">01 Apr 2026 → 05 May 2026</span>
          </div>
          {["This Month", "Last Month", "Custom"].map((pill, i) => (
            <span key={pill} className={`px-2 py-0.5 rounded-full text-[6px] font-semibold ${i === 0 ? "bg-brand-navy text-white" : "bg-white border border-slate-200 text-slate-500"}`}>
              {pill}
            </span>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Total Sales", value: "₹4,28,500", color: "text-brand-emerald" },
            { label: "Total GST", value: "₹51,420", color: "text-violet-600" },
            { label: "Net Profit", value: "₹1,12,340", color: "text-brand-cyan" },
            { label: "Total Returns", value: "₹8,200", color: "text-orange-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-lg border border-slate-100 shadow-sm p-1.5">
              <p className="text-slate-400 text-[6px]">{kpi.label}</p>
              <p className={`font-bold text-[8px] ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          {/* Bar chart */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-2 flex flex-col">
            <p className="text-[7px] font-semibold text-slate-700 mb-1.5">Month-wise Sales</p>
            <div className="flex items-end gap-1 flex-1">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t-sm ${i === bars.length - 1 ? "bg-brand-cyan" : "bg-brand-navy/20"}`}
                    style={{ height: `${(h / max) * 100}%` }}
                  />
                  <span className="text-[5px] text-slate-400">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top medicines */}
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-2 flex flex-col gap-1.5">
            <p className="text-[7px] font-semibold text-slate-700">Top Selling Medicines</p>
            {topMeds.map((med, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-navy/10 text-brand-navy text-[6px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[6px] text-slate-700 font-medium truncate">{med.name}</p>
                  <p className="text-[5.5px] text-slate-400">{med.revenue}</p>
                </div>
                <TrendingUp className="w-2 h-2 text-brand-emerald shrink-0" />
              </div>
            ))}

            {/* Export button */}
            <button className="mt-auto bg-brand-emerald text-white text-[6px] font-semibold w-full h-5 rounded flex items-center justify-center gap-1">
              <Download className="w-2 h-2" />
              Export GSTR1 to Excel
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Screen 6 — Suppliers ──────────────────────────────────────────── */
function SuppliersScreen() {
  const suppliers = [
    { name: "Apex Pharma Distributors", city: "Delhi", phone: "9876543210", purchases: 45, total: "₹2,40,000" },
    { name: "MedCorp Wholesale", city: "Mumbai", phone: "9123456789", purchases: 23, total: "₹1,10,000" },
    { name: "PharmaDist Jaipur", city: "Jaipur", phone: "9988776655", purchases: 12, total: "₹62,000" },
    { name: "SunLife Pharma", city: "Chennai", phone: "9001122334", purchases: 8, total: "₹38,500" },
  ];

  return (
    <AppShell activeNav="Suppliers">
      <div className="flex flex-col gap-2 h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold text-slate-800">Suppliers</p>
          <button className="bg-brand-emerald text-white text-[6px] font-semibold px-2 h-5 rounded">+ Add Supplier</button>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {suppliers.map((s, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-100 shadow-sm p-2 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[7px] font-bold text-slate-800 leading-tight truncate">{s.name}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-2 h-2 text-slate-400 shrink-0" />
                    <span className="text-[6px] text-slate-400">{s.city}</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-brand-navy/10 flex items-center justify-center shrink-0">
                  <span className="text-[7px] font-bold text-brand-navy">{s.name[0]}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Phone className="w-2 h-2 text-slate-400 shrink-0" />
                <span className="text-[6px] text-slate-500">{s.phone}</span>
              </div>
              <div className="flex gap-2">
                <div>
                  <p className="text-[5.5px] text-slate-400">Purchases</p>
                  <p className="text-[7px] font-semibold text-slate-700">{s.purchases}</p>
                </div>
                <div>
                  <p className="text-[5.5px] text-slate-400">Total Value</p>
                  <p className="text-[7px] font-semibold text-brand-emerald">{s.total}</p>
                </div>
              </div>
              <button className="w-full border border-brand-navy/30 text-brand-navy text-[6px] font-semibold h-4 rounded mt-auto">
                View Ledger
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Screen registry ───────────────────────────────────────────────── */
const SCREENS: React.ComponentType[] = [
  DashboardScreen,
  POSBillingScreen,
  InventoryScreen,
  PurchasesScreen,
  ReportsScreen,
  SuppliersScreen,
];

/* ─── Direction-aware variants ──────────────────────────────────────── */
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

/* ─── BrowserChrome ─────────────────────────────────────────────────── */
function BrowserChrome({
  label,
  children,
  onClose,
  isLightbox = false,
}: {
  label: string;
  children: React.ReactNode;
  onClose?: () => void;
  isLightbox?: boolean;
}) {
  return (
    <div className={`flex flex-col w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 ${isLightbox ? "rounded-xl" : ""}`}>
      {/* Chrome bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-2 shrink-0">
        <div className="flex gap-1.5">
          {onClose ? (
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors flex items-center justify-center"
            >
              <X className="w-1.5 h-1.5 text-red-900 opacity-0 group-hover:opacity-100" />
            </button>
          ) : (
            <div className="w-3 h-3 rounded-full bg-red-400" />
          )}
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-2 bg-white rounded border border-slate-200 py-0.5 px-2 text-xs text-slate-400 font-mono truncate">
          ShelfCure — {label}
        </div>
        <ZoomIn className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </div>
      {/* Screen area */}
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );
}

/* ─── Main Section ──────────────────────────────────────────────────── */
export default function Screenshots() {
  const [[active, direction], setScreen] = useState<[number, number]>([0, 0]);
  const [lightbox, setLightbox] = useState<boolean>(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function goTo(idx: number) {
    setScreen(([prev]) => [idx, idx > prev ? 1 : -1]);
  }
  function prev() {
    setScreen(([a]) => [a === 0 ? 5 : a - 1, -1]);
  }
  function next() {
    setScreen(([a]) => [a === 5 ? 0 : a + 1, 1]);
  }

  /* Auto-advance */
  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setScreen(([a]) => [a === 5 ? 0 : a + 1, 1]);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!paused) startInterval();
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, startInterval]);

  /* Reset timer on manual change */
  useEffect(() => {
    if (!paused) startInterval();
  }, [active, paused, startInterval]);

  /* Keyboard for lightbox */
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const ActiveScreen = SCREENS[active];

  return (
    <section id="screenshots" className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            App Screenshots
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            See ShelfCure in Action
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto text-lg">
            Every screen is designed for speed — built for busy Indian pharmacies.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">

          {/* ── Left panel — Tab list (38%) ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:w-[38%] flex flex-col"
          >
            {/* Mobile: horizontal scroll strip */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => goTo(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 text-xs font-semibold transition-all border ${
                      active === tab.id
                        ? "bg-white border-brand-cyan text-brand-navy shadow-sm"
                        : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={13} />
                    {tab.title}
                  </button>
                );
              })}
            </div>

            {/* Desktop: vertical tab list */}
            <div className="hidden lg:flex flex-col gap-1 flex-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => goTo(tab.id)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                      isActive
                        ? "bg-white border-l-2 border-l-brand-cyan border-slate-200 shadow-sm"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? "bg-brand-cyan/10" : "bg-slate-100 group-hover:bg-slate-200"
                    }`}>
                      <Icon size={16} className={isActive ? "text-brand-cyan" : "text-slate-500"} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm leading-tight ${isActive ? "text-brand-navy" : "text-slate-700"}`}>
                        {tab.title}
                      </p>
                      <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{tab.description}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="hidden lg:block mt-4 h-0.5 bg-slate-100 rounded-full overflow-hidden">
              <AnimatePresence mode="wait">
                {!paused && (
                  <motion.div
                    key={active}
                    className="h-full bg-brand-cyan rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    exit={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Disclaimer note */}
            <p className="hidden lg:block text-[11px] text-slate-400 mt-3 leading-relaxed">
              Real screenshots will be added soon — these mockups accurately represent the UI.
            </p>
          </motion.div>

          {/* ── Right panel — Browser viewer (62%) ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-[62%]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative" style={{ aspectRatio: "16/10" }}>
              <BrowserChrome label={TABS[active].title}>
                {/* Screen area */}
                <div
                  className="relative w-full h-full cursor-zoom-in overflow-hidden"
                  onClick={() => setLightbox(true)}
                >
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={active}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <ActiveScreen />
                    </motion.div>
                  </AnimatePresence>

                  {/* Nav arrows (visible on hover) */}
                  <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    <button
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all pointer-events-auto"
                      onClick={(e) => { e.stopPropagation(); prev(); }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all pointer-events-auto"
                      onClick={(e) => { e.stopPropagation(); next(); }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Zoom hint */}
                  <div className="absolute bottom-3 right-3 pointer-events-none">
                    <span className="flex items-center gap-1 bg-black/40 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                      <ZoomIn size={10} />
                      Click to zoom
                    </span>
                  </div>
                </div>
              </BrowserChrome>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => goTo(tab.id)}
                  className={`rounded-full transition-all ${
                    active === tab.id
                      ? "w-5 h-2 bg-brand-cyan"
                      : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
                  }`}
                  aria-label={tab.title}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-8"
            onClick={() => setLightbox(false)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => setLightbox(false)}
            >
              <X size={18} />
            </button>

            {/* Lightbox content */}
            <div
              className="w-full max-w-5xl"
              style={{ aspectRatio: "16/10" }}
              onClick={(e) => e.stopPropagation()}
            >
              <BrowserChrome label={TABS[active].title} onClose={() => setLightbox(false)} isLightbox>
                <div className="relative w-full h-full overflow-hidden">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={active}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <ActiveScreen />
                    </motion.div>
                  </AnimatePresence>

                  {/* Nav arrows */}
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); next(); }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </BrowserChrome>
            </div>

            {/* Label */}
            <p className="mt-4 text-white/60 text-sm font-medium">
              {TABS[active].title} — {TABS[active].description}
            </p>

            {/* Lightbox dot nav */}
            <div className="flex items-center gap-1.5 mt-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => { e.stopPropagation(); goTo(tab.id); }}
                  className={`rounded-full transition-all ${
                    active === tab.id
                      ? "w-5 h-2 bg-brand-cyan"
                      : "w-2 h-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={tab.title}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
