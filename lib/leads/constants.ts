// Shared lead-pipeline constants — used by admin API routes, the admin UI,
// and (later) the mobile sales app, so the lifecycle stays consistent.
//
// The `leads.status` column is free TEXT (no DB constraint); these arrays
// are the single source of truth for what counts as a valid status.

export interface StatusMeta {
  value: string;
  label: string;
  cls: string; // Tailwind classes for the status pill
}

// Full lead lifecycle (PRD §7.4). The original 7 statuses remain valid;
// the rest were added in Phase 2.
export const LEAD_STATUSES: StatusMeta[] = [
  { value: "new",                label: "New",                cls: "bg-slate-100 text-slate-600"     },
  { value: "contacted",          label: "Contacted",          cls: "bg-blue-100 text-blue-600"       },
  { value: "followup_pending",   label: "Follow-up Pending",  cls: "bg-sky-100 text-sky-700"         },
  { value: "call_not_picked",    label: "Call Not Picked",    cls: "bg-zinc-100 text-zinc-600"       },
  { value: "interested",         label: "Interested",         cls: "bg-amber-100 text-amber-700"     },
  { value: "visit_planned",      label: "Visit Planned",      cls: "bg-teal-100 text-teal-700"       },
  { value: "demo_scheduled",     label: "Demo Scheduled",     cls: "bg-indigo-100 text-indigo-700"   },
  { value: "demo_done",          label: "Demo Done",          cls: "bg-purple-100 text-purple-700"   },
  { value: "trial_activated",    label: "Trial Activated",    cls: "bg-cyan-100 text-cyan-700"       },
  { value: "negotiating",        label: "Negotiating",        cls: "bg-orange-100 text-orange-600"   },
  { value: "payment_pending",    label: "Payment Pending",    cls: "bg-yellow-100 text-yellow-700"   },
  { value: "future_opportunity", label: "Future Opportunity", cls: "bg-stone-100 text-stone-600"     },
  { value: "converted",          label: "Converted",          cls: "bg-emerald-100 text-emerald-700" },
  { value: "lost",               label: "Lost",               cls: "bg-red-100 text-red-500"         },
];

export const LEAD_STATUS_VALUES = LEAD_STATUSES.map((s) => s.value);

export function leadStatusMeta(value: string): StatusMeta {
  return LEAD_STATUSES.find((s) => s.value === value)
    ?? { value, label: value, cls: "bg-slate-100 text-slate-500" };
}

// Mandatory reason when a lead is marked Lost (PRD §7.5).
export const LOST_REASONS: { value: string; label: string }[] = [
  { value: "price_issue",           label: "Price issue"            },
  { value: "existing_software",     label: "Existing software"      },
  { value: "not_interested",        label: "Not interested"         },
  { value: "decision_postponed",    label: "Decision postponed"     },
  { value: "owner_unavailable",     label: "Owner unavailable"      },
  { value: "no_computer",           label: "No computer"            },
  { value: "no_internet",           label: "No internet"            },
  { value: "staff_resistance",      label: "Staff resistance"       },
  { value: "competitor_preference", label: "Competitor preference"  },
  { value: "budget_issue",          label: "Budget issue"           },
  { value: "other",                 label: "Other"                  },
];

export const LOST_REASON_VALUES = LOST_REASONS.map((r) => r.value);
