import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

// Shared authentication for all /api/sales/* routes (the mobile app).
// The Flutter app signs in with Supabase Auth and sends the access token
// as `Authorization: Bearer <jwt>`. This helper validates that token and
// resolves the caller's sales_profiles row.

export interface SalesProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;          // 'admin' | 'field_sales' | 'demo_team'
  is_active: boolean;
}

export type SalesAuthResult =
  | { ok: true; userId: string; profile: SalesProfile }
  | { ok: false; status: number; error: string };

export async function authenticateSalesUser(req: NextRequest): Promise<SalesAuthResult> {
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "Missing bearer token" };

  // Validate the JWT against Supabase Auth.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) return { ok: false, status: 401, error: "Invalid or expired session" };

  // Resolve the sales profile (service client — bypasses RLS).
  const supabase = createServiceClient();
  const { data: profile, error: profErr } = await supabase
    .from("sales_profiles")
    .select("id, full_name, email, phone, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr)            return { ok: false, status: 500, error: profErr.message };
  if (!profile)           return { ok: false, status: 403, error: "No sales profile for this account" };
  if (!profile.is_active) return { ok: false, status: 403, error: "This account has been deactivated" };

  return { ok: true, userId: user.id, profile: profile as SalesProfile };
}

/// True when the caller can read/write this lead: either it's assigned to
/// them, or they have the admin role.
export async function userCanAccessLead(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createServiceClient>,
  leadId: string,
  userId: string,
  role: string,
): Promise<boolean> {
  if (role === "admin") return true;
  const { data } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("id", leadId)
    .maybeSingle();
  return !!data && data.assigned_to === userId;
}
