"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, Smartphone, FlaskConical } from "lucide-react";
import { formatDate } from "@/lib/utils";
import LicenseActions from "./LicenseActions";
import type { DesktopLicense } from "./page";

const TYPE_STYLES = {
  trial:    { label: "Trial",    cls: "bg-orange-100 text-orange-600" },
  yearly:   { label: "1 Year",   cls: "bg-blue-100 text-blue-600"   },
  lifetime: { label: "Lifetime", cls: "bg-emerald-100 text-emerald-700" },
};

type MobileFilter = "all" | "yes" | "no";
type TypeFilter = "all" | "trial" | "yearly" | "lifetime";
type StatusFilter = "all" | "active" | "suspended";
type TestFilter = "all" | "real" | "test";

export default function LicensesTable({ licenses }: { licenses: DesktopLicense[] }) {
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState<MobileFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [test, setTest] = useState<TestFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return licenses.filter((lic) => {
      if (q) {
        const hay = [lic.pharmacy_name, lic.license_key, lic.owner_email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (mobile === "yes" && !lic.mobile_addon) return false;
      if (mobile === "no" && lic.mobile_addon) return false;
      if (type !== "all" && lic.license_type !== type) return false;
      if (status === "active" && lic.status !== "active") return false;
      if (status === "suspended" && lic.status === "active") return false;
      if (test === "test" && !lic.is_test) return false;
      if (test === "real" && lic.is_test) return false;

      // Date filter — by created date (purchase date)
      const created = lic.created_at ? lic.created_at.split("T")[0] : null;
      if (fromDate && (!created || created < fromDate)) return false;
      if (toDate && (!created || created > toDate)) return false;

      return true;
    });
  }, [licenses, query, mobile, type, status, test, fromDate, toDate]);

  const hasActiveFilter =
    query || mobile !== "all" || type !== "all" || status !== "all" || test !== "all" || fromDate || toDate;

  function clearAll() {
    setQuery(""); setMobile("all"); setType("all"); setStatus("all"); setTest("all");
    setFromDate(""); setToDate("");
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pharmacy name, license key, or email…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy transition-colors"
            />
          </div>

          <Select value={type} onChange={(v) => setType(v as TypeFilter)} options={[
            { value: "all", label: "All Types" },
            { value: "trial", label: "Trial" },
            { value: "yearly", label: "1 Year" },
            { value: "lifetime", label: "Lifetime" },
          ]} />

          <Select value={status} onChange={(v) => setStatus(v as StatusFilter)} options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]} />

          <Select value={mobile} onChange={(v) => setMobile(v as MobileFilter)} options={[
            { value: "all", label: "Mobile: All" },
            { value: "yes", label: "Has Mobile" },
            { value: "no", label: "No Mobile" },
          ]} />

          <Select value={test} onChange={(v) => setTest(v as TestFilter)} options={[
            { value: "all", label: "All Accounts" },
            { value: "real", label: "Real Only" },
            { value: "test", label: "Test Only" },
          ]} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Bought between</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy"
          />
          <span className="text-xs text-slate-400">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy"
          />
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 px-2 py-1.5 transition-colors"
            >
              <X size={13} /> Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">
            Showing <span className="font-bold text-slate-700">{filtered.length}</span> of {licenses.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["License Key", "Pharmacy", "Type", "Status", "Machines", "Expiry", "Add-ons", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!filtered.length ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    {licenses.length ? "No licenses match these filters" : "No licenses yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((lic) => {
                  const isActive       = lic.status === "active";
                  const activatedCount = Array.isArray(lic.activated_machines) ? lic.activated_machines.length : 0;
                  const typeStyle      = TYPE_STYLES[lic.license_type] ?? TYPE_STYLES.trial;

                  return (
                    <tr key={lic.license_key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-700 select-all">
                          {lic.license_key}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                        <Link
                          href={`/admin/licenses/${encodeURIComponent(lic.license_key)}`}
                          className="text-brand-navy hover:underline"
                        >
                          {lic.pharmacy_name || "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeStyle.cls}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {activatedCount} / {lic.max_machines}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {lic.expiry_date ? formatDate(lic.expiry_date) : "Lifetime"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {lic.mobile_addon && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              <Smartphone size={10} /> Mobile
                            </span>
                          )}
                          {lic.is_test && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <FlaskConical size={10} /> Test
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <LicenseActions
                          licenseKey={lic.license_key}
                          isActive={isActive}
                          pharmacyName={lic.pharmacy_name}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-navy bg-white transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
