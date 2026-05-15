// Shared constants for the expenses module. Keep this file in sync with
// the CHECK constraints on public.expenses (see supabase_expenses.sql).

export const EXPENSE_CATEGORIES = [
  { value: "marketing",         label: "Marketing" },
  { value: "salaries",          label: "Salaries" },
  { value: "software",          label: "Software / SaaS" },
  { value: "infrastructure",    label: "Infrastructure" },
  { value: "office",            label: "Office" },
  { value: "travel",            label: "Travel" },
  { value: "professional_fees", label: "Professional fees" },
  { value: "taxes",             label: "Taxes" },
  { value: "refunds",           label: "Refunds" },
  { value: "other",             label: "Other" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

export const PAYMENT_METHODS = [
  { value: "card",          label: "Card" },
  { value: "upi",           label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash",          label: "Cash" },
  { value: "cheque",        label: "Cheque" },
  { value: "other",         label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export function categoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

// Tailwind colour classes per category — used for the badge in the list
// and the breakdown pie/bar segments on the report page.
export const CATEGORY_COLORS: Record<string, string> = {
  marketing:         "bg-pink-100 text-pink-700",
  salaries:          "bg-indigo-100 text-indigo-700",
  software:          "bg-blue-100 text-blue-700",
  infrastructure:    "bg-cyan-100 text-cyan-700",
  office:            "bg-amber-100 text-amber-700",
  travel:            "bg-emerald-100 text-emerald-700",
  professional_fees: "bg-violet-100 text-violet-700",
  taxes:             "bg-rose-100 text-rose-700",
  refunds:           "bg-orange-100 text-orange-700",
  other:             "bg-slate-100 text-slate-700",
};
