import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/expenses/constants";

const CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value) as string[];
const METHOD_VALUES   = PAYMENT_METHODS.map((m) => m.value) as string[];

// PUT /api/admin/expenses/[id] — partial update. Any subset of editable
// fields can be sent; whatever is omitted is left alone.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patch: Record<string, unknown> = {};

  if (body.spent_on !== undefined) {
    if (typeof body.spent_on !== "string") return NextResponse.json({ error: "Invalid spent_on" }, { status: 400 });
    patch.spent_on = body.spent_on;
  }
  if (body.category !== undefined) {
    if (!CATEGORY_VALUES.includes(body.category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    patch.category = body.category;
  }
  if (body.description !== undefined) {
    const d = String(body.description).trim();
    if (!d) return NextResponse.json({ error: "description cannot be empty" }, { status: 400 });
    patch.description = d;
  }
  if (body.amount_rupees !== undefined) {
    const r = Number(body.amount_rupees);
    if (!Number.isFinite(r) || r < 0) return NextResponse.json({ error: "Invalid amount_rupees" }, { status: 400 });
    patch.amount_paise = Math.round(r * 100);
  }
  if (body.vendor !== undefined)         patch.vendor    = String(body.vendor || "").trim()    || null;
  if (body.reference !== undefined)      patch.reference = String(body.reference || "").trim() || null;
  if (body.notes !== undefined)          patch.notes     = String(body.notes || "").trim()     || null;
  if (body.payment_method !== undefined) {
    const m = body.payment_method;
    if (m && !METHOD_VALUES.includes(m)) return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 });
    patch.payment_method = m || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
