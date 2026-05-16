import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintTrigger from "./PrintTrigger";

export const dynamic = "force-dynamic";

const LICENSE_TYPE_LABELS: Record<string, string> = {
  trial:    "Trial (7 days)",
  yearly:   "1 Year",
  lifetime: "Lifetime",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  one_time:      "One-time Payment",
  "3_month_emi": "3-Month EMI",
  "6_month_emi": "6-Month EMI",
};

const METHOD_LABELS: Record<string, string> = {
  cash:          "Cash",
  upi:           "UPI",
  bank_transfer: "Bank Transfer",
  razorpay:      "Razorpay",
  cheque:        "Cheque",
  other:         "Other",
};

function fmt(amount: number) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtPhone(phone: string) {
  const clean = phone.replace(/^\+91[-\s]?/, "").replace(/^0/, "");
  return `+91-${clean}`;
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const licenseKey = decodeURIComponent(key);

  const supabase = await createServiceClient();

  const PAY_COLS = "id, payment_type, base_amount, gst_rate, total_amount, notes, created_at, product, cycle_start_date, cycle_end_date, license_payment_installments(installment_number, amount, due_date, paid_date, payment_method, reference_id, notes)";

  const [{ data: lic }, { data: desktopPays }, { data: mobilePays }, { data: pricing }] = await Promise.all([
    supabase.from("desktop_licenses").select("*").eq("license_key", licenseKey).single(),
    supabase.from("license_payments").select(PAY_COLS)
      .eq("license_key", licenseKey).eq("product", "desktop")
      .order("created_at", { ascending: false }).limit(1),
    supabase.from("license_payments").select(PAY_COLS)
      .eq("license_key", licenseKey).eq("product", "mobile")
      .order("created_at", { ascending: false }).limit(1),
    supabase.from("pricing_settings").select("ai_credits_included").eq("id", 1).maybeSingle(),
  ]);

  if (!lic) notFound();

  const now = new Date();
  const invoiceDate = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const invoiceNumber = `INV-${licenseKey.slice(-8).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  interface RawInst {
    installment_number: number;
    amount: number;
    due_date: string;
    paid_date: string | null;
    payment_method: string | null;
    reference_id: string | null;
    notes: string | null;
  }

  function blockFromRow(raw: any) {
    if (!raw) return null;
    const installments: RawInst[] = (raw.license_payment_installments ?? [])
      .slice()
      .sort((a: RawInst, b: RawInst) => a.installment_number - b.installment_number);
    const paid    = installments.reduce((s, i) => s + (i.paid_date ? i.amount : 0), 0);
    const pending = raw.total_amount - paid;
    const pct     = Math.min(Math.round((paid / raw.total_amount) * 100), 100);
    return {
      paymentType:    raw.payment_type as string,
      baseAmount:     raw.base_amount as number | null,
      gstRate:        raw.gst_rate as number | null,
      totalAmount:    raw.total_amount as number,
      notes:          raw.notes as string | null,
      cycleStart:     raw.cycle_start_date as string | null,
      cycleEnd:       raw.cycle_end_date as string | null,
      installments,
      amountPaid:     paid,
      amountPending:  pending,
      paidPct:        pct,
    };
  }

  const desktopBlock = blockFromRow(desktopPays?.[0]);
  const mobileBlock  = blockFromRow(mobilePays?.[0]);

  const expiryDate = lic.expiry_date ? fmtDate(lic.expiry_date) : "Lifetime (No Expiry)";

  // Base AI credits included with the license — from global pricing settings
  const aiIncluded: number | null = pricing?.ai_credits_included != null
    ? Number(pricing.ai_credits_included)
    : null;

  // Emails
  const ownerEmail   = lic.owner_email   ?? null;
  const contactEmail = lic.contact_email ?? null;
  const showContactEmail = contactEmail && contactEmail !== ownerEmail;

  // Store details
  const ownerName  = (lic as any).owner_name  ?? null;
  const gstNumber  = (lic as any).gst_number  ?? null;
  const drugLicense = (lic as any).drug_license ?? null;

  return (
    <>
      <PrintTrigger />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

        .page-wrapper {
          max-width: 820px;
          margin: 32px auto;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 32px rgba(0,0,0,0.10);
        }

        /* Print bar */
        .print-bar {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .print-bar-hint { font-size: 13px; color: #64748b; }

        /* Header */
        .inv-header {
          background: #0f172a;
          padding: 24px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .inv-header-left { display: flex; flex-direction: column; gap: 6px; }
        .inv-logo { height: 52px; width: auto; display: block; }
        .inv-legal {
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          line-height: 1.5;
        }
        .inv-legal strong { color: #94a3b8; letter-spacing: 0.04em; }
        .inv-meta { text-align: right; flex-shrink: 0; }
        .inv-meta-label {
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .inv-meta-number {
          font-size: 15px;
          font-weight: 700;
          color: #06b6d4;
          margin-top: 3px;
        }
        .inv-meta-date { font-size: 12px; color: #475569; margin-top: 3px; }

        /* Bill To + License Key strip */
        .inv-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 2px solid #f1f5f9;
        }
        .inv-billto { padding: 24px 40px; border-right: 1px solid #f1f5f9; }
        .inv-keybox { padding: 24px 40px; background: #fafafa; }

        .section-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .billto-name { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .billto-line { font-size: 13px; color: #64748b; line-height: 1.7; }
        .billto-icon { font-size: 11px; margin-right: 4px; }

        .key-value {
          font-family: 'Courier New', Courier, monospace;
          font-size: 16px;
          font-weight: 700;
          color: #06b6d4;
          letter-spacing: 0.06em;
          word-break: break-all;
          margin-bottom: 6px;
        }
        .key-hint { font-size: 11px; color: #94a3b8; }

        /* Body */
        .inv-body { padding: 28px 40px; }
        .inv-section { margin-bottom: 26px; }
        .inv-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding-bottom: 8px;
          border-bottom: 2px solid #f1f5f9;
          margin-bottom: 14px;
        }

        /* Details grid */
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
        .detail-row { display: flex; flex-direction: column; gap: 2px; }
        .detail-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .detail-value { font-size: 14px; font-weight: 600; color: #0f172a; }

        /* Payment rows */
        .pay-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          font-size: 14px;
          border-bottom: 1px solid #f8fafc;
        }
        .pay-row:last-child { border-bottom: none; }
        .pay-label { color: #64748b; }
        .pay-value { font-weight: 600; color: #0f172a; }
        .pay-value.paid { color: #10b981; }
        .pay-value.pending { color: #ef4444; }
        .pay-value.total { font-size: 16px; }

        .progress-track { background: #f1f5f9; border-radius: 999px; height: 8px; overflow: hidden; margin: 12px 0 4px; }
        .progress-fill  { background: #10b981; height: 100%; border-radius: 999px; }
        .progress-pct   { font-size: 11px; color: #94a3b8; text-align: right; }

        /* EMI table */
        .emi-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          font-size: 13px;
        }
        .emi-table thead tr { background: #f8fafc; }
        .emi-table th {
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .emi-table th.right { text-align: right; }
        .emi-table td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .emi-table tr:last-child td { border-bottom: none; }
        .emi-table td.center { text-align: center; color: #94a3b8; }
        .emi-table td.amount { text-align: right; font-weight: 600; color: #0f172a; }
        .status-paid { color: #10b981; font-weight: 600; }
        .status-due  { color: #f59e0b; font-weight: 600; }

        /* Footer */
        .inv-footer {
          background: #0f172a;
          padding: 20px 40px;
        }
        .inv-footer-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1e293b;
        }
        .inv-footer-company { font-size: 11px; color: #94a3b8; line-height: 1.7; }
        .inv-footer-company strong { color: #cbd5e1; font-size: 12px; }
        .inv-footer-contact { font-size: 11px; color: #64748b; text-align: right; line-height: 1.7; }
        .inv-footer-contact a { color: #06b6d4; text-decoration: none; }
        .inv-footer-bottom { font-size: 11px; color: #334155; text-align: center; }

        /* Print */
        @media print {
          @page { size: A4 portrait; margin: 10mm 8mm; }
          body { background: #fff; }
          .print-bar { display: none !important; }
          .page-wrapper { margin: 0; box-shadow: none; border-radius: 0; max-width: 100%; }
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          a[href]::after { content: none !important; }
        }
      `}</style>

      <div className="page-wrapper">

        {/* Print bar */}
        <div className="print-bar">
          <span className="print-bar-hint">Invoice {invoiceNumber} &nbsp;·&nbsp; {lic.pharmacy_name}</span>
          <PrintTrigger />
        </div>

        <div className="invoice">

          {/* ── Header ── */}
          <div className="inv-header">
            <div className="inv-header-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ShelfCure" className="inv-logo" />
              <div className="inv-legal">
                <strong>SHELFCURE TECHNICAL SOLUTIONS PRIVATE LIMITED</strong><br />
                Registration No. 21ABQCS2873P1ZM &nbsp;·&nbsp; shelfcure.com
              </div>
            </div>
            <div className="inv-meta">
              <div className="inv-meta-label">Invoice</div>
              <div className="inv-meta-number">{invoiceNumber}</div>
              <div className="inv-meta-date">{invoiceDate}</div>
            </div>
          </div>

          {/* ── Bill To + License Key ── */}
          <div className="inv-top">
            <div className="inv-billto">
              <div className="section-label">Bill To</div>
              <div className="billto-name">{lic.pharmacy_name || "—"}</div>

              {ownerName && (
                <div className="billto-line" style={{ fontWeight: 600, color: "#334155" }}>
                  {ownerName}
                </div>
              )}

              {lic.address && (
                <div className="billto-line">{lic.address}</div>
              )}

              {ownerEmail && (
                <div className="billto-line" style={{ marginTop: "6px" }}>
                  <span className="billto-icon">✉</span>{ownerEmail}
                  {showContactEmail && (
                    <span style={{ color: "#94a3b8", marginLeft: "4px" }}>(owner)</span>
                  )}
                </div>
              )}
              {showContactEmail && (
                <div className="billto-line">
                  <span className="billto-icon">✉</span>{contactEmail}
                  <span style={{ color: "#94a3b8", marginLeft: "4px" }}>(contact)</span>
                </div>
              )}

              {lic.contact_phone && (
                <div className="billto-line">
                  <span className="billto-icon">📞</span>{fmtPhone(lic.contact_phone)}
                </div>
              )}

              {(gstNumber || drugLicense) && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", lineHeight: 1.8 }}>
                  {gstNumber   && <div><strong style={{ color: "#334155" }}>GST:</strong> {gstNumber}</div>}
                  {drugLicense && <div><strong style={{ color: "#334155" }}>Drug Lic:</strong> {drugLicense}</div>}
                </div>
              )}
            </div>

            <div className="inv-keybox">
              <div className="section-label">License Key</div>
              <div className="key-value">{licenseKey}</div>
              <div className="key-hint">ShelfCure → Settings → Activate License</div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="inv-body">

            {/* License Details */}
            <div className="inv-section">
              <div className="inv-section-title">License Details</div>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">License Type</span>
                  <span className="detail-value">{LICENSE_TYPE_LABELS[lic.license_type] ?? lic.license_type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Plan</span>
                  <span className="detail-value">{lic.plan ?? "Standard"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Valid Until</span>
                  <span className="detail-value">{expiryDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Max Machines</span>
                  <span className="detail-value">{lic.max_machines ?? 1}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value" style={{ color: lic.status === "active" ? "#10b981" : "#ef4444", textTransform: "capitalize" }}>
                    {lic.status}
                  </span>
                </div>
                {aiIncluded != null && aiIncluded > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">AI Credits Included</span>
                    <span className="detail-value">{aiIncluded}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Payment Block */}
            {desktopBlock && (
              <PaymentBlock title="Desktop License — Payment Details" block={desktopBlock} />
            )}

            {/* Mobile Payment Block (recurring) */}
            {mobileBlock && (
              <PaymentBlock title="Mobile Scanner App — Yearly Subscription" block={mobileBlock} accent="#10b981" />
            )}

            {/* Thank you */}
            <div style={{ textAlign: "center", padding: "18px 20px", background: "#f8fafc", borderRadius: "12px", marginBottom: "4px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                Thank you for choosing ShelfCure!
              </p>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                For support: <span style={{ color: "#06b6d4" }}>info@shelfcure.com</span>
                {" · "}
                WhatsApp: <span style={{ color: "#10b981" }}>+91-70648 44320</span>
              </p>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="inv-footer">
            <div className="inv-footer-top">
              <div className="inv-footer-company">
                <strong>SHELFCURE TECHNICAL SOLUTIONS PRIVATE LIMITED</strong><br />
                Registration No. 21ABQCS2873P1ZM<br />
                shelfcure.com &nbsp;·&nbsp; info@shelfcure.com
              </div>
              <div className="inv-footer-contact">
                <a href="mailto:info@shelfcure.com">info@shelfcure.com</a><br />
                <a href="https://wa.me/917064844320">+91-70648 44320</a><br />
                shelfcure.com
              </div>
            </div>
            <div className="inv-footer-bottom">
              © {new Date().getFullYear()} ShelfCure Technical Solutions Pvt. Ltd. &nbsp;·&nbsp;
              This is a computer-generated invoice and does not require a physical signature.
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

interface PaymentBlockData {
  paymentType: string;
  baseAmount: number | null;
  gstRate: number | null;
  totalAmount: number;
  notes: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  installments: {
    installment_number: number;
    amount: number;
    due_date: string;
    paid_date: string | null;
    payment_method: string | null;
    reference_id: string | null;
    notes: string | null;
  }[];
  amountPaid: number;
  amountPending: number;
  paidPct: number;
}

function PaymentBlock({ title, block, accent }: { title: string; block: PaymentBlockData; accent?: string }) {
  const showGst = block.baseAmount != null && block.gstRate != null && block.gstRate > 0;
  const hasEmi = block.installments.length > 1;
  const showMethod = block.installments.some((i) => i.payment_method);
  const showRef    = block.installments.some((i) => i.reference_id);

  return (
    <div className="inv-section">
      <div className="inv-section-title" style={accent ? { color: accent, borderBottomColor: accent + "22" } : undefined}>
        {title}
      </div>

      {block.cycleStart && block.cycleEnd && (
        <div className="pay-row">
          <span className="pay-label">Subscription Cycle</span>
          <span className="pay-value">{fmtDate(block.cycleStart)} → {fmtDate(block.cycleEnd)}</span>
        </div>
      )}

      <div className="pay-row">
        <span className="pay-label">Payment Plan</span>
        <span className="pay-value">{PAYMENT_TYPE_LABELS[block.paymentType] ?? block.paymentType}</span>
      </div>

      {showGst ? (
        <>
          <div className="pay-row">
            <span className="pay-label">Base Amount</span>
            <span className="pay-value">{fmt(block.baseAmount!)}</span>
          </div>
          <div className="pay-row">
            <span className="pay-label">GST ({block.gstRate}%)</span>
            <span className="pay-value">{fmt(block.totalAmount - block.baseAmount!)}</span>
          </div>
          <div className="pay-row" style={{ borderTop: "1px solid #e2e8f0", marginTop: "2px", paddingTop: "8px" }}>
            <span className="pay-label" style={{ fontWeight: 700, color: "#0f172a" }}>Total (incl. GST)</span>
            <span className="pay-value total">{fmt(block.totalAmount)}</span>
          </div>
        </>
      ) : (
        <div className="pay-row">
          <span className="pay-label">Total Amount</span>
          <span className="pay-value total">{fmt(block.totalAmount)}</span>
        </div>
      )}

      <div className="pay-row">
        <span className="pay-label">Amount Paid</span>
        <span className="pay-value paid">{fmt(block.amountPaid)}</span>
      </div>
      {block.amountPending > 0 && (
        <div className="pay-row">
          <span className="pay-label">Amount Pending</span>
          <span className="pay-value pending">{fmt(block.amountPending)}</span>
        </div>
      )}

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${block.paidPct}%`, background: accent ?? "#10b981" }} />
      </div>
      <div className="progress-pct">{block.paidPct}% paid</div>

      {/* EMI Schedule or single payment */}
      {hasEmi ? (
        <table className="emi-table" style={{ marginTop: "14px" }}>
          <thead>
            <tr>
              <th style={{ width: "40px", textAlign: "center" }}>#</th>
              <th className="right">Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              {showMethod && <th>Method</th>}
              {showRef && <th>Reference</th>}
            </tr>
          </thead>
          <tbody>
            {block.installments.map((inst) => {
              const isPaid = !!inst.paid_date;
              const method = inst.payment_method ? (METHOD_LABELS[inst.payment_method] ?? inst.payment_method) : null;
              return (
                <tr key={inst.installment_number}>
                  <td className="center">{inst.installment_number}</td>
                  <td className="amount">{fmt(inst.amount)}</td>
                  <td style={{ color: "#64748b" }}>{fmtDate(inst.due_date)}</td>
                  <td>
                    {isPaid
                      ? <span className="status-paid">✓ Paid {fmtDate(inst.paid_date)}</span>
                      : <span className="status-due">○ Due {fmtDate(inst.due_date)}</span>}
                  </td>
                  {showMethod && <td style={{ color: "#64748b" }}>{method ?? "—"}</td>}
                  {showRef && (
                    <td style={{ color: "#64748b", fontFamily: "monospace", fontSize: "12px" }}>
                      {inst.reference_id ?? "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : block.installments[0] && (
        <div style={{
          marginTop: "12px",
          background: block.installments[0].paid_date ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${block.installments[0].paid_date ? "#bbf7d0" : "#fde68a"}`,
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: "13px",
          fontWeight: 600,
          color: block.installments[0].paid_date ? "#15803d" : "#92400e",
        }}>
          {block.installments[0].paid_date
            ? `✓ Paid on ${fmtDate(block.installments[0].paid_date)}${block.installments[0].payment_method ? ` via ${METHOD_LABELS[block.installments[0].payment_method] ?? block.installments[0].payment_method}` : ""}`
            : `○ Due on ${fmtDate(block.installments[0].due_date)}`}
          {block.installments[0].reference_id && (
            <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "8px", fontFamily: "monospace", fontSize: "12px" }}>
              ({block.installments[0].reference_id})
            </span>
          )}
        </div>
      )}

      {block.notes && (
        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "10px", fontStyle: "italic" }}>{block.notes}</p>
      )}
    </div>
  );
}
