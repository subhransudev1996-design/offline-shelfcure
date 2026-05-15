import { createServiceClient } from "@/lib/supabase/server";
import ExpensesClient from "./ExpensesClient";

export const dynamic = "force-dynamic";

export interface ExpenseRow {
  id: string;
  spent_on: string;
  category: string;
  vendor: string | null;
  description: string;
  amount_paise: number;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default async function ExpensesPage() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <ExpensesClient
      initialExpenses={(data ?? []) as ExpenseRow[]}
      loadError={error?.message ?? null}
    />
  );
}
