import React from "react";
import {
  Document, Page, View, Text, StyleSheet, Font, Image
} from "@react-pdf/renderer";

const NAVY  = "#0f172a";
const CYAN  = "#06b6d4";
const SLATE = "#64748b";
const LIGHT = "#f1f5f9";
const GREEN = "#10b981";
const RED   = "#ef4444";
const AMBER = "#f59e0b";
const WHITE = "#ffffff";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page:       { fontFamily: "Helvetica", fontSize: 10, color: NAVY, backgroundColor: WHITE, padding: "32pt 36pt" },

  // Header
  header:     { backgroundColor: NAVY, borderRadius: 10, padding: "18pt 24pt", marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand:      { fontSize: 20, fontFamily: "Helvetica-Bold", color: WHITE, letterSpacing: -0.5 },
  brandCyan:  { color: CYAN },
  brandSub:   { fontSize: 7.5, color: "#94a3b8", marginTop: 3, letterSpacing: 1 },
  brandLegal: { fontSize: 7, color: "#475569", marginTop: 2 },
  invLabel:   { fontSize: 8, color: "#94a3b8", textAlign: "right" },
  invNum:     { fontSize: 11, fontFamily: "Helvetica-Bold", color: CYAN, marginTop: 2, textAlign: "right" },
  invDate:    { fontSize: 8, color: SLATE, marginTop: 2, textAlign: "right" },

  // Bill-to + key row
  topRow:     { flexDirection: "row", gap: 16, marginBottom: 14 },
  billBox:    { flex: 1, backgroundColor: "#f8fafc", borderRadius: 8, padding: "14pt 16pt", border: `1pt solid ${BORDER}` },
  keyBox:     { flex: 1, borderRadius: 8, padding: "14pt 16pt", border: `1pt solid ${BORDER}` },
  sectionLbl: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },

  billName:   { fontSize: 14, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 2 },
  billOwner:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#334155", marginBottom: 2 },
  billLine:   { fontSize: 9, color: SLATE, lineHeight: 1.5 },
  legalBox:   { marginTop: 6, paddingTop: 6, borderTop: `1pt solid ${BORDER}` },
  legalLine:  { fontSize: 8, color: SLATE, marginBottom: 1 },
  legalBold:  { fontFamily: "Helvetica-Bold", color: "#334155" },

  keyDark:    { backgroundColor: NAVY, borderRadius: 8, padding: "12pt 14pt" },
  keyLbl:     { fontSize: 7, color: "#64748b", letterSpacing: 0.8, marginBottom: 5 },
  keyVal:     { fontFamily: "Courier-Bold", fontSize: 11, color: CYAN, letterSpacing: 1 },
  keyHint:    { fontSize: 7, color: "#475569", marginTop: 5 },

  // Section heading
  secTitle:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 1, textTransform: "uppercase", paddingBottom: 5, borderBottom: `1.5pt solid ${LIGHT}`, marginBottom: 8 },

  // Detail rows (license / payment)
  detailRow:  { flexDirection: "row", justifyContent: "space-between", paddingTop: 4, paddingBottom: 4, borderBottom: `0.5pt solid ${LIGHT}` },
  detLabel:   { fontSize: 9, color: "#94a3b8", flex: 1 },
  detValue:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY, flex: 1, textAlign: "right" },

  // Summary amounts
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 3, paddingBottom: 3 },
  sumLabel:   { fontSize: 9, color: "#94a3b8" },
  sumTotal:   { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY },
  sumPaid:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: GREEN },
  sumPending: { fontSize: 9, fontFamily: "Helvetica-Bold", color: RED },

  // Progress
  progressBg: { backgroundColor: LIGHT, borderRadius: 99, height: 5, marginTop: 8, marginBottom: 3 },
  progressFg: { backgroundColor: GREEN, borderRadius: 99, height: 5 },
  progressPct:{ fontSize: 8, color: "#94a3b8", textAlign: "right" },

  // Table
  table:      { border: `1pt solid ${BORDER}`, borderRadius: 6, overflow: "hidden", marginTop: 4 },
  thead:      { backgroundColor: "#f8fafc", flexDirection: "row", borderBottom: `1pt solid ${BORDER}`, padding: "7pt 10pt" },
  th:         { fontSize: 8, fontFamily: "Helvetica-Bold", color: SLATE },
  tbody:      {},
  trow:       { flexDirection: "row", padding: "7pt 10pt", borderBottom: `0.5pt solid ${LIGHT}` },
  td:         { fontSize: 9, color: SLATE },
  tdBold:     { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY },

  // Status badge
  badgePaid:  { backgroundColor: "#f0fdf4", border: `1pt solid #bbf7d0`, borderRadius: 6, padding: "8pt 12pt" },
  badgeDue:   { backgroundColor: "#fffbeb", border: `1pt solid #fde68a`, borderRadius: 6, padding: "8pt 12pt" },
  badgeText:  { fontSize: 10, fontFamily: "Helvetica-Bold" },

  // Footer
  footer:     { backgroundColor: NAVY, borderRadius: 10, padding: "14pt 24pt", marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  footLeft:   { fontSize: 8, color: "#475569" },
  footRight:  { fontSize: 8, color: "#334155", textAlign: "right" },

  section:    { marginBottom: 14 },
});

const L_TYPES: Record<string, string> = {
  trial: "Trial (7 days)", yearly: "1 Year", lifetime: "Lifetime",
};
const P_TYPES: Record<string, string> = {
  one_time: "One-time Payment", "3_month_emi": "3-Month EMI", "6_month_emi": "6-Month EMI",
};
const METHODS: Record<string, string> = {
  cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer",
  razorpay: "Razorpay", cheque: "Cheque", other: "Other",
};

function fmt(n: number) { return "Rs. " + Math.round(n).toLocaleString("en-IN"); }
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

interface Inst {
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  reference_id: string | null;
}

export interface PaymentBlock {
  paymentType: string;
  baseAmount: number | null;
  gstRate: number | null;
  totalAmount: number;
  notes: string | null;
  cycleStart: string | null;
  cycleEnd: string | null;
  installments: Inst[];
  amountPaid: number;
  amountPending: number;
}

interface InvoicePDFProps {
  pharmacyName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  gstNumber: string | null;
  drugLicense: string | null;
  licenseKey: string;
  licenseType: string;
  plan: string | null;
  expiryDate: string | null;
  maxMachines: number;
  aiIncluded: number | null;
  desktopBlock: PaymentBlock | null;
  mobileBlock: PaymentBlock | null;
  invoiceDate: string;
  invoiceNumber: string;
  logoBase64?: string;
  // Optional (not rendered in PDF — kept so the same props object can be passed to email HTML too)
  downloadUrl?: string;
  softwareVersion?: string | null;
  mobileDownloadUrl?: string | null;
  mobileVersion?: string | null;
}

export function InvoicePDF({
  pharmacyName, ownerName, ownerEmail, contactEmail, contactPhone,
  address, gstNumber, drugLicense,
  licenseKey, licenseType, plan, expiryDate, maxMachines, aiIncluded,
  desktopBlock, mobileBlock, invoiceDate, invoiceNumber,
  logoBase64,
}: InvoicePDFProps) {
  const showContact = contactEmail && contactEmail !== ownerEmail;
  const phone = contactPhone
    ? "+91-" + contactPhone.replace(/^\+91[-\s]?/, "").replace(/^0/, "")
    : null;

  return (
    <Document title={`ShelfCure Invoice ${invoiceNumber}`} author="ShelfCure">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            {logoBase64 ? (
              <Image src={logoBase64} style={{ width: 140, height: "auto", marginBottom: 6 }} />
            ) : (
              <Text style={s.brand}>Shelf<Text style={s.brandCyan}>Cure</Text></Text>
            )}
            <Text style={s.brandSub}>PHARMACY MANAGEMENT SOFTWARE</Text>
            <Text style={s.brandLegal}>SHELFCURE TECHNICAL SOLUTIONS PVT. LTD.</Text>
          </View>
          <View>
            <Text style={s.invLabel}>INVOICE</Text>
            <Text style={s.invNum}>{invoiceNumber}</Text>
            <Text style={s.invDate}>{invoiceDate}</Text>
          </View>
        </View>

        {/* ── Bill To + License Key ── */}
        <View style={s.topRow}>
          {/* Bill To */}
          <View style={s.billBox}>
            <Text style={s.sectionLbl}>Bill To</Text>
            <Text style={s.billName}>{pharmacyName}</Text>
            {ownerName  && <Text style={s.billOwner}>{ownerName}</Text>}
            {address    && <Text style={s.billLine}>{address}</Text>}
            {ownerEmail && <Text style={[s.billLine, { marginTop: 4 }]}>✉ {ownerEmail}{showContact ? " (owner)" : ""}</Text>}
            {showContact && <Text style={s.billLine}>✉ {contactEmail} (contact)</Text>}
            {phone      && <Text style={s.billLine}>📞 {phone}</Text>}
            {(gstNumber || drugLicense) && (
              <View style={s.legalBox}>
                {gstNumber   && <Text style={s.legalLine}><Text style={s.legalBold}>GST: </Text>{gstNumber}</Text>}
                {drugLicense && <Text style={s.legalLine}><Text style={s.legalBold}>Drug Lic.: </Text>{drugLicense}</Text>}
              </View>
            )}
          </View>

          {/* License Key */}
          <View style={s.keyBox}>
            <Text style={s.sectionLbl}>License Key</Text>
            <View style={s.keyDark}>
              <Text style={s.keyLbl}>YOUR LICENSE KEY</Text>
              <Text style={s.keyVal}>{licenseKey}</Text>
              <Text style={s.keyHint}>ShelfCure → Settings → Activate License</Text>
            </View>
          </View>
        </View>

        {/* ── License Details ── */}
        <View style={s.section}>
          <Text style={s.secTitle}>License Details</Text>
          <View style={s.detailRow}>
            <Text style={s.detLabel}>License Type</Text>
            <Text style={s.detValue}>{L_TYPES[licenseType] ?? licenseType}</Text>
          </View>
          {plan && (
            <View style={s.detailRow}>
              <Text style={s.detLabel}>Plan</Text>
              <Text style={s.detValue}>{plan}</Text>
            </View>
          )}
          <View style={s.detailRow}>
            <Text style={s.detLabel}>Valid Until</Text>
            <Text style={s.detValue}>{expiryDate ? fmtDate(expiryDate) : "Lifetime (No Expiry)"}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detLabel}>Max Machines</Text>
            <Text style={s.detValue}>{maxMachines}</Text>
          </View>
          {aiIncluded != null && aiIncluded > 0 && (
            <View style={s.detailRow}>
              <Text style={s.detLabel}>AI Credits Included</Text>
              <Text style={s.detValue}>{aiIncluded}</Text>
            </View>
          )}
        </View>

        {/* Desktop License Payment */}
        {desktopBlock && (
          <PdfPaymentSection title="Desktop License — Payment Details" block={desktopBlock} accent={NAVY} />
        )}

        {/* Mobile Add-on Payment (recurring yearly) */}
        {mobileBlock && (
          <PdfPaymentSection title="Mobile Scanner App — Yearly Subscription" block={mobileBlock} accent={GREEN} />
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View>
            <Text style={s.footLeft}>© {new Date().getFullYear()} SHELFCURE TECHNICAL SOLUTIONS PRIVATE LIMITED</Text>
            <Text style={s.footLeft}>Reg. No. 21ABQCS2873P1ZM  ·  shelfcure.com</Text>
          </View>
          <Text style={s.footRight}>System-generated invoice</Text>
        </View>

      </Page>
    </Document>
  );
}

function PdfPaymentSection({
  title, block, accent,
}: { title: string; block: PaymentBlock; accent: string }) {
  const showGst = block.baseAmount != null && block.gstRate != null && block.gstRate > 0;
  const gstAmount = showGst ? Math.round(block.totalAmount - block.baseAmount!) : 0;
  const paidPct = Math.min(Math.round((block.amountPaid / block.totalAmount) * 100), 100);
  const hasEmi = block.installments.length > 1;
  const single = !hasEmi ? block.installments[0] : null;

  return (
    <View style={s.section}>
      <Text style={[s.secTitle, { color: accent }]}>{title}</Text>

      {block.cycleStart && block.cycleEnd && (
        <View style={s.summaryRow}>
          <Text style={s.sumLabel}>Subscription Cycle</Text>
          <Text style={s.detValue}>{fmtDate(block.cycleStart)} → {fmtDate(block.cycleEnd)}</Text>
        </View>
      )}

      <View style={s.summaryRow}>
        <Text style={s.sumLabel}>Payment Plan</Text>
        <Text style={s.detValue}>{P_TYPES[block.paymentType] ?? block.paymentType}</Text>
      </View>

      {showGst ? (
        <>
          <View style={s.summaryRow}>
            <Text style={s.sumLabel}>Base Amount</Text>
            <Text style={s.detValue}>{fmt(block.baseAmount!)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.sumLabel}>GST ({block.gstRate}%)</Text>
            <Text style={s.detValue}>{fmt(gstAmount)}</Text>
          </View>
          <View style={[s.summaryRow, { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 4, marginTop: 2 }]}>
            <Text style={[s.sumLabel, { fontFamily: "Helvetica-Bold", color: "#0f172a" }]}>Total (incl. GST)</Text>
            <Text style={s.sumTotal}>{fmt(block.totalAmount)}</Text>
          </View>
        </>
      ) : (
        <View style={s.summaryRow}>
          <Text style={s.sumLabel}>Total Amount</Text>
          <Text style={s.sumTotal}>{fmt(block.totalAmount)}</Text>
        </View>
      )}

      <View style={s.summaryRow}>
        <Text style={s.sumLabel}>Amount Paid</Text>
        <Text style={s.sumPaid}>{fmt(block.amountPaid)}</Text>
      </View>
      {block.amountPending > 0 && (
        <View style={s.summaryRow}>
          <Text style={s.sumLabel}>Amount Pending</Text>
          <Text style={s.sumPending}>{fmt(block.amountPending)}</Text>
        </View>
      )}

      <View style={s.progressBg}>
        <View style={[s.progressFg, { width: `${paidPct}%`, backgroundColor: accent }]} />
      </View>
      <Text style={s.progressPct}>{paidPct}% collected</Text>

      {hasEmi && (
        <View style={[s.table, { marginTop: 8 }]}>
          <View style={s.thead}>
            <Text style={[s.th, { width: 30, textAlign: "center" }]}>#</Text>
            <Text style={[s.th, { width: 80, textAlign: "right" }]}>Amount</Text>
            <Text style={[s.th, { width: 90 }]}>Due Date</Text>
            <Text style={[s.th, { flex: 1 }]}>Status</Text>
          </View>
          <View style={s.tbody}>
            {block.installments.map((inst) => {
              const isPaid = !!inst.paid_date;
              const method = inst.payment_method ? (METHODS[inst.payment_method] ?? inst.payment_method) : null;
              const statusColor = isPaid ? GREEN : AMBER;
              const statusText = isPaid
                ? `Paid ${fmtDate(inst.paid_date)}${method ? ` via ${method}` : ""}`
                : `Due ${fmtDate(inst.due_date)}`;
              return (
                <View key={inst.installment_number} style={s.trow}>
                  <Text style={[s.td, { width: 30, textAlign: "center" }]}>{inst.installment_number}</Text>
                  <Text style={[s.tdBold, { width: 80, textAlign: "right" }]}>{fmt(inst.amount)}</Text>
                  <Text style={[s.td, { width: 90 }]}>{fmtDate(inst.due_date)}</Text>
                  <Text style={[s.td, { flex: 1, color: statusColor }]}>{isPaid ? "✓ " : "○ "}{statusText}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {single && (
        <View style={[single.paid_date ? s.badgePaid : s.badgeDue, { marginTop: 8 }]}>
          <Text style={[s.badgeText, { color: single.paid_date ? "#15803d" : "#92400e" }]}>
            {single.paid_date
              ? `✓ Payment received on ${fmtDate(single.paid_date)}${single.payment_method ? ` via ${METHODS[single.payment_method] ?? single.payment_method}` : ""}`
              : `○ Payment due on ${fmtDate(single.due_date)}`}
          </Text>
        </View>
      )}

      {block.notes && (
        <Text style={{ fontSize: 8, color: SLATE, marginTop: 6, fontStyle: "italic" }}>{block.notes}</Text>
      )}
    </View>
  );
}
