import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const PROMPT = `You are a pharmacy inventory assistant. Scan this medicine box/strip/bottle image and extract ONLY these fields.

=== CRITICAL: MFG vs EXPIRY DISAMBIGUATION ===
Indian medicine labels almost ALWAYS print TWO dates close together — Manufacturing date AND Expiry date. They are often stacked vertically in a tight right-aligned column with tiny labels. You MUST extract the EXPIRY date, not the Mfg date.

How to identify each date:

1) LABEL FIRST (highest priority). Look at the label text printed next to or above each date:
   - MFG / MFD / MFG. / MFD. / MFG DATE / MFG.DT / M.D / Mfg Dt / Mfg.By / MFG BY / Date of Mfg / DOM   → this is MANUFACTURING — IGNORE this date.
   - EXP / EXP. / EXPIRY / EXPIRY DATE / EXP DT / EXP.DT / E.D / Exp Dt / Use Before / Use By / Best Before / BB / B/B / Valid Till / Valid Upto   → this is EXPIRY — extract this one.

2) IF LABELS ARE MISSING OR UNREADABLE, use these fallbacks (in order):
   a) ORDER: On Indian pharma labels, when two dates are stacked, MFG is on TOP and EXP is BELOW. The LOWER date in the stack is usually the expiry.
   b) CHRONOLOGY: The LATER (more future) date is the expiry. The EARLIER date is the mfg. Expiry is typically 18–36 months after mfg. Example: dates "JUN 2025" and "MAY 2027" → mfg=JUN 2025, expiry=MAY 2027 → return "2027-05-01".
   c) PLAUSIBILITY: Expiry must be in the FUTURE relative to today, or at most a few months in the past. Manufacturing must be in the PAST. If a candidate date is earlier than today by more than ~6 months, it is almost certainly the MFG, not the expiry.

3) NEVER return the manufacturing date as expiry_date. If you are unsure which is which, return null rather than guessing wrong.

4) If only ONE date is printed AND it is clearly labeled "Exp" / "Use Before" / "Best Before" → that is the expiry. If only one date is printed with NO label and no other date nearby, AND it is in the future → it is most likely the expiry.

=== FIELDS TO EXTRACT ===
- batch_number: alphanumeric code labeled "Batch No.", "Lot No.", "B.No.", "Batch:", "B/N" — e.g. "ACG1234", "T5001B". Do NOT confuse with MRP or HSN. Return null if not visible.
- expiry_date: see disambiguation rules above. Convert ALL formats to YYYY-MM-01:
    "09/26" → "2026-09-01"
    "MAY 2027" / "MAY-27" / "MAY/27" / "05/27" / "05-2027" → "2027-05-01"
    "JAN-27" → "2027-01-01"
    "12/2026" → "2026-12-01"
  Return null if not visible OR if you cannot confidently distinguish it from the mfg date.
- mrp: number after "MRP", "M.R.P", "MRP ₹", "MRP Rs.", "M.R.P (Incl. of all taxes)" — e.g. 120.00. Return null if not visible.

Return ONLY valid JSON, no markdown:
{"batch_number": "string or null", "expiry_date": "YYYY-MM-01 or null", "mrp": number or null}`;

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, imageBase64, mimeType } = await req.json();

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (!imageBase64 || !mimeType)
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });

    const supabase = createServiceClient();

    // Verify license and check scan credits
    const { data: lic, error: licErr } = await supabase
      .from("desktop_licenses")
      .select("license_key, status, label_scans_used")
      .eq("license_key", licenseKey.trim())
      .single();

    if (licErr || !lic)
      return NextResponse.json({ error: "Invalid license key" }, { status: 404 });
    if (lic.status !== "active")
      return NextResponse.json({ error: "License is not active" }, { status: 403 });

    const remaining = lic.label_scans_used ?? 0;
    if (remaining < 1)
      return NextResponse.json(
        { error: "OUT_OF_SCANS", message: "No label scan credits remaining. Contact ShelfCure to top up." },
        { status: 402 }
      );

    // Call Gemini
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
        generationConfig: { temperature: 0.05, responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
    }

    const geminiJson = await geminiRes.json();
    const text: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: { batch_number: string | null; expiry_date: string | null; mrp: number | null };
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Sanity check: if the returned expiry is clearly in the past, the model
    // almost certainly picked up the Mfg date instead. Drop it rather than
    // auto-adding expired stock — user can re-scan or enter manually.
    if (parsed.expiry_date) {
      const exp = new Date(parsed.expiry_date);
      if (!isNaN(exp.getTime())) {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 3);
        if (exp < cutoff) parsed.expiry_date = null;
      }
    }

    // Deduct 1 credit
    await supabase
      .from("desktop_licenses")
      .update({ label_scans_used: Math.max(0, remaining - 1) })
      .eq("license_key", licenseKey.trim());

    // Save result to scan queue so desktop can pick it up
    await supabase.from("desktop_scan_queue").insert({
      license_key: licenseKey.trim(),
      scan_type:   "label_ocr",
      batch_number: parsed.batch_number ?? null,
      expiry_date:  parsed.expiry_date  ?? null,
      mrp:          parsed.mrp          ?? null,
    });

    return NextResponse.json({
      success:      true,
      batch_number: parsed.batch_number,
      expiry_date:  parsed.expiry_date,
      mrp:          parsed.mrp,
      scans_remaining: Math.max(0, remaining - 1),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
