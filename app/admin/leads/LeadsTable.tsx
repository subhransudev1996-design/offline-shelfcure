"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Phone, MapPin, Calendar, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new:         "New",
  contacted:   "Contacted",
  interested:  "Interested",
  demo_done:   "Demo Done",
  negotiating: "Negotiating",
  converted:   "Converted",
  lost:        "Lost",
};

const STATUS_STYLES: Record<string, string> = {
  new:         "bg-slate-100 text-slate-600",
  contacted:   "bg-blue-100 text-blue-600",
  interested:  "bg-amber-100 text-amber-700",
  demo_done:   "bg-purple-100 text-purple-700",
  negotiating: "bg-orange-100 text-orange-600",
  converted:   "bg-emerald-100 text-emerald-700",
  lost:        "bg-red-100 text-red-500",
};

const SOURCE_LABELS: Record<string, string> = {
  cold_call:    "Cold Call",
  referral:     "Referral",
  website:      "Website",
  facebook_ads: "Facebook Ads",
  google_ads:   "Google Ads",
  exhibition:   "Exhibition",
  walk_in:      "Walk-in",
  other:        "Other",
};

const INTEREST_LABELS: Record<string, string> = {
  trial:    "Trial",
  yearly:   "1 Year",
  lifetime: "Lifetime",
  unsure:   "Not Sure",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface Followup {
  id: string;
  type: string;
  outcome: string | null;
  next_followup_date: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  owner_name: string;
  pharmacy_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  source: string;
  status: string;
  license_interest: string | null;
  notes: string | null;
  converted_license_key: string | null;
  created_at: string;
  updated_at: string;
  lead_followups: Followup[];
}

const ALL_STATUSES = ["all", "new", "contacted", "interested", "demo_done", "negotiating", "converted", "lost"];

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [query,        setQuery]        = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((l) => {
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      const matchesQuery  = !q
        || l.owner_name.toLowerCase().includes(q)
        || (l.pharmacy_name ?? "").toLowerCase().includes(q)
        || (l.phone ?? "").includes(q)
        || (l.city ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [leads, query, statusFilter]);

  function getNextFollowup(lead: Lead): string | null {
    const dates = lead.lead_followups
      .map((f) => f.next_followup_date)
      .filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort().at(-1)!;
  }

  function isDueToday(lead: Lead) {
    return lead.lead_followups.some((f) => f.next_followup_date === today);
  }

  function isOverdue(lead: Lead) {
    return lead.lead_followups.some((f) => f.next_followup_date && f.next_followup_date < today);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, pharmacy, phone, city..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:border-brand-cyan"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${
                statusFilter === s
                  ? "bg-brand-navy text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Lead", "Contact", "Location", "Source", "Interest", "Status", "Next Followup", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    {query || statusFilter !== "all" ? "No leads match your filters" : "No leads yet — add your first lead"}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const nextDate    = getNextFollowup(lead);
                  const dueToday    = isDueToday(lead);
                  const overdue     = isOverdue(lead);
                  const followupCount = lead.lead_followups.length;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Lead info */}
                      <td className="px-5 py-3.5">
                        <div>
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="font-semibold text-slate-900 hover:text-brand-navy"
                          >
                            {lead.owner_name}
                          </Link>
                          {lead.pharmacy_name && (
                            <p className="text-xs text-slate-400 mt-0.5">{lead.pharmacy_name}</p>
                          )}
                          {followupCount > 0 && (
                            <p className="text-xs text-slate-300 mt-0.5">{followupCount} followup{followupCount !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone size={11} className="text-slate-400" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">{lead.email}</p>
                          )}
                          {!lead.phone && !lead.email && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5">
                        {(lead.city || lead.state) ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={11} className="text-slate-300" />
                            {[lead.city, lead.state].filter(Boolean).join(", ")}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {SOURCE_LABELS[lead.source] ?? lead.source}
                        </span>
                      </td>

                      {/* Interest */}
                      <td className="px-5 py-3.5">
                        {lead.license_interest ? (
                          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {INTEREST_LABELS[lead.license_interest] ?? lead.license_interest}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[lead.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {STATUS_LABELS[lead.status] ?? lead.status}
                        </span>
                      </td>

                      {/* Next Followup */}
                      <td className="px-5 py-3.5">
                        {nextDate ? (
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${
                            dueToday   ? "text-amber-600" :
                            overdue    ? "text-red-500"   :
                                        "text-slate-500"
                          }`}>
                            <Calendar size={11} />
                            {dueToday ? "Today" : overdue ? "Overdue" : fmtDate(nextDate)}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="flex items-center gap-1 text-xs text-brand-navy font-medium hover:underline"
                        >
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
