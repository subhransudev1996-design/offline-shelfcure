import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// ── Existing prompt (mode='batch'): batch number, expiry, MRP, barcode from side panel ──
const PROMPT_BATCH = `You are a pharmacy inventory assistant. Scan this medicine box/strip/bottle image and extract these fields: batch_number, expiry_date, mrp, barcode.

=== HOW TO READ INDIAN MEDICINE LABELS ===

The label has TWO independent layers:
A) PRINTED LABELS — pre-printed on the box: "Batch No.", "Mfg. Date", "Use Before" / "Exp", "M.R.P.", "(Incl. of all taxes)", "₹ Per ml", etc.
B) STAMPED VALUES — added LATER by the manufacturer using an inkjet/dot-matrix printer at packing time. These look different from printed text (often dotty, slightly slanted, blue/black, sometimes blurred or faded).

CRITICAL: The stamped values are NOT always horizontally aligned with their printed label. They are commonly:
- Stamped as a vertical column on the right side of the label area
- Shifted DOWN by one or more rows relative to the label they belong to
- Shifted to the right or left so they no longer line up with any single label row
- All values stamped in one vertical block, separate from the printed labels

⚠️ DO NOT match a stamped value to a printed label by horizontal row alignment alone. Use the stamped values' OWN ORDER (top-to-bottom) and the typical Indian-label sequence: Batch → Mfg Date → Expiry → MRP → ₹/unit.

=== STEP-BY-STEP EXTRACTION ===

Step 1: Find ALL stamped (inkjet/dot-matrix) text in the label region. List them top-to-bottom.

Step 2: Classify each stamped value by its FORMAT:
- Alphanumeric code mixing letters and digits, no slashes (e.g. "KCK405", "ACG1234", "T5001B", "SD-337") → BATCH NUMBER
- Date in format MM/YY, MM/YYYY, MM-YY, MM-YYYY, MMM YYYY, MMM-YY, DD/MM/YYYY → DATE
- Pure number with decimal, ₹50–₹50000 range (e.g. "499.00", "120.50", "1250") → MRP
- Pure number under ₹50 with two decimals (e.g. "8.31", "12.50") → likely ₹/unit (per ml/per tablet), NOT MRP

Step 3: If you found 2 dates, the EARLIER date is Mfg, the LATER date is Expiry. Always.
- Indian pharma expiry is typically 18–36 months after mfg
- Example: "11/2024" and "11/2026" → mfg=11/2024, expiry=11/2026 → return "2026-11-01"
- Example: "JUN 2025" and "MAY 2027" → expiry=MAY 2027 → return "2027-05-01"

Step 4: If you found only 1 date:
- If it's clearly labeled with EXP / Exp / Expiry / Use Before / Use By / Best Before / BB / Valid Till / Valid Upto → it's expiry
- If it's clearly labeled with MFG / MFD / Mfg Date / Mfg Dt / DOM → it's mfg, return null for expiry
- If unlabeled AND the date is in the future relative to today → likely expiry
- If unlabeled AND the date is in the past → likely mfg, return null for expiry

Step 5: Distinguish MRP from ₹/unit price:
- "M.R.P. ₹ : 499.00" — the BIGGER number is MRP
- "(Incl. of all taxes) 8.31" or "₹ Per ml : 8.31" — the SMALLER per-unit number is NOT MRP
- If two prices are stamped, MRP is the LARGER one. Per-unit price is typically MRP ÷ pack-size and is much smaller.

=== EXAMPLES ===

Example A (row-offset stamping — common pattern):
Printed labels (left column, top to bottom): "Batch No. :", "Mfg. Date :", "Use Before :", "M.R.P. ₹ :", "(Incl. of all taxes)", "₹ Per ml :"
Stamped values (right column, top to bottom): "KCK405", "11/2024", "11/2026", "499.00", "8.31"
Note: stamped values may visually appear shifted down — "KCK405" might look like it's next to "Mfg. Date" instead of "Batch No.". IGNORE the visual offset. Match by ORDER and FORMAT.
→ batch_number="KCK405", expiry_date="2026-11-01" (the LATER of the two dates), mrp=499.00 (the LARGER price; 8.31 is per-ml).

Example B (clean alignment):
"B.No. ACG1234   MFG 06/2024   EXP 05/2027   MRP ₹ 120.00"
→ batch_number="ACG1234", expiry_date="2027-05-01", mrp=120.00

Example C (only one date, labeled):
"Use Before: 12/2026   MRP ₹ 85.00   B/N: T5001B"
→ batch_number="T5001B", expiry_date="2026-12-01", mrp=85.00

=== DATE FORMAT NORMALIZATION ===
Always return YYYY-MM-01:
  "09/26" → "2026-09-01"
  "11/2026" → "2026-11-01"
  "MAY 2027" / "MAY-27" / "MAY/27" / "05/27" / "05-2027" → "2027-05-01"
  "JAN-27" → "2027-01-01"
  "31/05/2027" / "31-05-27" → "2027-05-01"

=== BARCODE EXTRACTION ===
Look for a 1D BARCODE printed somewhere on the box (most often on the side panel, sometimes the back). It looks like a block of parallel vertical black lines of varying width, with a row of digits printed DIRECTLY UNDERNEATH the lines.

- Read the digit string printed under the barcode pattern. This is the GTIN/EAN/UPC.
- Indian medicine barcodes are almost always EAN-13 (exactly 13 digits, often starting with "890" — the India country code) or sometimes EAN-8 (8 digits) or UPC-A (12 digits).
- Return ONLY the digits, no spaces, no separators. Example: "8901030672408".
- DO NOT confuse with the batch number (alphanumeric, no barcode lines above it) or with the MRP / weight / pack size.
- DO NOT make up digits. If part of the number is blurred or cropped, return null.
- If the box has a QR code instead of (or in addition to) a 1D barcode, ignore the QR and only return a 1D barcode if visible. If no 1D barcode is visible at all, return null.

=== FINAL CHECKS ===
- If you cannot confidently identify the expiry, return null. Do NOT guess.
- NEVER return a manufacturing date as expiry_date.
- If the label is too blurry / cropped / partial to read a field, return null for that field.
- expiry_date must be in YYYY-MM-01 format or null.
- barcode must be a digit-only string (8/12/13 digits) or null.
- Return ONLY valid JSON, no markdown, no explanation:

{"batch_number": "string or null", "expiry_date": "YYYY-MM-01 or null", "mrp": number or null, "barcode": "string or null"}`;

// ── Medicine front-of-box prompt (mode='medicine') ────────────────────────
// Used by the scanner's "Add New Medicine" flow when the user shoots the
// front of the box. Extracts brand name, manufacturer, strength, generic
// (salt) name. Does NOT extract batch/expiry/MRP — those go via mode='batch'
// or mode='full'.
const PROMPT_MEDICINE = `You are a pharmacy inventory assistant. Scan the FRONT of this medicine box/strip/bottle and extract identification fields.

=== FIELDS TO EXTRACT ===

- name: BRAND name as printed in the largest font on the front. Examples: "Calpol 500", "Crocin Advance", "Combiflam", "Dolo 650". Strip the strength suffix only if it appears as a separate logo element; if "500" or "650 mg" is part of the brand styling, keep it. Do NOT include manufacturer name. Return null if unclear.

- manufacturer: Company name printed somewhere on the box, often near "Mfg. By" / "Marketed by" / "MFR" / a small logo at the bottom. Examples: "GlaxoSmithKline Pharmaceuticals Ltd.", "Cipla Ltd.", "Sun Pharma", "Aurochem Laboratories Pvt. Ltd.". Use the SHORTEST recognizable form (e.g. "Cipla" not "Cipla Ltd. Mumbai..."). Return null if not visible.

- strength: Active ingredient strength like "500mg", "650 mg", "120ml", "10mg/5ml", "0.05%", "5g". This is OFTEN part of the visual brand block ("Paracetamol 500 mg"). Return as a single string with the unit. Return null if not visible.

- salt_composition: Generic / chemical name printed in smaller text below the brand. Examples: "Paracetamol", "Paracetamol IP 500mg", "Diclofenac Sodium + Paracetamol", "Amoxycillin Trihydrate IP". This is the active ingredient(s). Return null if not visible.

=== RULES ===
- Front-of-box only. Ignore manufacturer addresses, batch numbers, dates, MRP — those belong on the side panel.
- Brand name is what the customer asks for ("Give me Calpol"). It is printed BIG. Don't confuse with manufacturer name (smaller, near a logo).
- If the brand name and the salt are visually combined ("Paracetamol Tablets IP" with no brand), treat the salt as the brand AND the salt.
- If unsure, return null. Don't guess.

Return ONLY valid JSON, no markdown:
{"name": "string or null", "manufacturer": "string or null", "strength": "string or null", "salt_composition": "string or null"}`;

// ── Full prompt (mode='full') — extracts everything from one photo ────────
// Less reliable than the dedicated modes, but cheaper (1 scan credit
// instead of 2). Used when the user photographs the whole box at once.
const PROMPT_FULL = `You are a pharmacy inventory assistant. Scan this medicine box image and extract BOTH front-of-box identification fields AND side-panel batch fields.

${PROMPT_BATCH}

ADDITIONALLY extract these front-of-box fields (same rules as medicine-only mode):
- name: brand name (largest text on front)
- manufacturer: company name (smaller, often near "Mfg. By" / "Marketed by")
- strength: like "500mg", "120ml", "10mg/5ml"
- salt_composition: generic / active ingredient name

If any field is not clearly visible or you're unsure, return null for that field. Don't guess.

Return ONLY valid JSON, no markdown:
{"batch_number": "string or null", "expiry_date": "YYYY-MM-01 or null", "mrp": number or null, "barcode": "string or null", "name": "string or null", "manufacturer": "string or null", "strength": "string or null", "salt_composition": "string or null"}`;

function pickPrompt(mode: string | undefined): string {
  switch ((mode ?? "batch").toLowerCase()) {
    case "medicine": return PROMPT_MEDICINE;
    case "full":     return PROMPT_FULL;
    case "batch":
    default:         return PROMPT_BATCH;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, imageBase64, mimeType, mode } = await req.json();

    if (!licenseKey?.trim())
      return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });
    if (!imageBase64 || !mimeType)
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });

    const promptMode = ((typeof mode === "string" ? mode : "batch")).toLowerCase();
    const prompt = pickPrompt(promptMode);

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
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
        generationConfig: { temperature: 0.05, responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 });
    }

    const geminiJson = await geminiRes.json();
    const text: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    type ScanResult = {
      batch_number?: string | null;
      expiry_date?: string | null;
      mrp?: number | null;
      barcode?: string | null;
      name?: string | null;
      manufacturer?: string | null;
      strength?: string | null;
      salt_composition?: string | null;
    };
    let parsed: ScanResult;
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

    // Sanitize barcode: digits only, 8/12/13 chars (EAN-8/UPC-A/EAN-13). Drop anything else.
    if (parsed.barcode) {
      const digits = String(parsed.barcode).replace(/\D/g, "");
      parsed.barcode = (digits.length === 8 || digits.length === 12 || digits.length === 13)
        ? digits
        : null;
    }

    // Deduct 1 credit
    await supabase
      .from("desktop_licenses")
      .update({ label_scans_used: Math.max(0, remaining - 1) })
      .eq("license_key", licenseKey.trim());

    // Save batch-side result to scan queue so desktop can pick it up.
    // (Only meaningful for batch/full modes; medicine mode has nothing useful here.)
    if (promptMode !== "medicine") {
      await supabase.from("desktop_scan_queue").insert({
        license_key: licenseKey.trim(),
        scan_type:   "label_ocr",
        batch_number: parsed.batch_number ?? null,
        expiry_date:  parsed.expiry_date  ?? null,
        mrp:          parsed.mrp          ?? null,
      });
    }

    return NextResponse.json({
      success:      true,
      mode:         promptMode,
      batch_number: parsed.batch_number ?? null,
      expiry_date:  parsed.expiry_date  ?? null,
      mrp:          parsed.mrp          ?? null,
      barcode:      parsed.barcode      ?? null,
      // Front-of-box fields (only populated for mode='medicine' or 'full')
      name:             parsed.name             ?? null,
      manufacturer:     parsed.manufacturer     ?? null,
      strength:         parsed.strength         ?? null,
      salt_composition: parsed.salt_composition ?? null,
      scans_remaining: Math.max(0, remaining - 1),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
