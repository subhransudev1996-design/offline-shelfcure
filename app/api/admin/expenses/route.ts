import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/expenses/constants";

const CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
const METHOD_VALUES   = PAYMENT_METHODS.map((m) => m.value) as string[];

// GET /api/admin/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD&category=marketing
// Returns the latest 500 matching rows. Filters are all optional.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from     = sp.get("from");
  const to       = sp.get("to");
  const category = sp.get("category");

  const supabase = createServiceClient();
  let q = supabase
    .from("expenses")
    .select("*")
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (from)     q = q.gte("spent_on", from);
  if (to)       q = q.lte("spent_on", to);
  if (category) q = q.eq("category", category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data ?? [] });
}

// POST /api/admin/expenses — create one.
// Body: { spent_on, category, description, amount_rupees, vendor?, payment_method?, reference?, notes? }
// Amounts come in as RUPEES (number), get stored as PAISE (bigint).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const {
    spent_on,
    category,
    description,
    amount_rupees,
    vendor,
    payment_method,
    reference,
    notes,
  } = body;

  if (!spent_on || typeof spent_on !== "string") {
    return NextResponse.json({ error: "spent_on (date) is required" }, { status: 400 });
  }
  if (!category || !CATEGORY_VALUES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }
  const rupees = Number(amount_rupees);
  if (!Number.isFinite(rupees) || rupees < 0) {
    return NextResponse.json({ error: "amount_rupees must be a non-negative number" }, { status: 400 });
  }
  if (payment_method && !METHOD_VALUES.includes(payment_method)) {
    return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      spent_on,
      category,
      description: description.trim(),
      amount_paise: Math.round(rupees * 100),
      vendor:         vendor?.trim()    || null,
      payment_method: payment_method    || null,
      reference:      reference?.trim() || null,
      notes:          notes?.trim()     || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}
