import { NextRequest, NextResponse } from "next/server";
import { authenticateSalesUser } from "@/lib/sales/auth";

// GET — resolve the signed-in mobile user from their Supabase JWT and return
// their sales profile. The Flutter app calls this right after login to learn
// the user's role and active status. Send: Authorization: Bearer <jwt>.
export async function GET(req: NextRequest) {
  const auth = await authenticateSalesUser(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ profile: auth.profile });
}
