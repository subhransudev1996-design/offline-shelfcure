import { createServiceClient } from "@/lib/supabase/server";
import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export interface SalesEmployee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default async function SalesEmployeesPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("sales_profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return <EmployeesClient employees={(data ?? []) as SalesEmployee[]} />;
}
