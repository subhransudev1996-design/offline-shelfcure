import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import React from "react";
import fs from "fs";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "./InvoicePDF";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function buildEmail(data: {
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
  aiCredits: number | null;
  paymentType: string | null;
  baseAmount: number | null;
  gstRate: number | null;
  totalAmount: number | null;
  amountPaid: number;
  amountPending: number;
  installments: {
    installment_number: number;
    amount: number;
    due_date: string;
    paid_date: string | null;
    payment_method: string | null;
    reference_id: string | null;
  }[];
  invoiceDate: string;
  invoiceNumber: string;
  downloadUrl: string;
  softwareVersion: string | null;
}) {
  const {
    pharmacyName, ownerName, ownerEmail, contactEmail, contactPhone,
    address, gstNumber, drugLicense,
    licenseKey, licenseType, plan, expiryDate, maxMachines, aiCredits,
    paymentType, baseAmount, gstRate, totalAmount, amountPaid, amountPending,
    installments, invoiceDate, invoiceNumber,
    downloadUrl, softwareVersion,
  } = data;
  const showGst = baseAmount != null && gstRate != null && gstRate > 0;
  const gstAmount = showGst ? Math.round(baseAmount! * gstRate! / 100) : null;

  const hasPayment = totalAmount != null && totalAmount > 0;
  const paidPct = hasPayment ? Math.min(Math.round((amountPaid / totalAmount!) * 100), 100) : 0;
  const showContactEmail = contactEmail && contactEmail !== ownerEmail;
  const hasEmi = installments.length > 1;

  const installmentRows = hasEmi ? installments.map((inst) => {
    const isPaid = !!inst.paid_date;
    const method = inst.payment_method ? (METHOD_LABELS[inst.payment_method] ?? inst.payment_method) : null;
    const statusText = isPaid
      ? `Paid on ${fmtDate(inst.paid_date)}${method ? ` via ${method}` : ""}${inst.reference_id ? ` (${inst.reference_id})` : ""}`
      : `Due ${fmtDate(inst.due_date)}`;
    const statusColor = isPaid ? "#10b981" : "#f59e0b";
    const statusDot = isPaid ? "✓" : "○";

    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;text-align:center;">
          ${inst.installment_number}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">
          ${fmt(inst.amount)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">
          <span style="color:${statusColor};font-weight:600;">${statusDot}</span>
          &nbsp;${statusText}
        </td>
      </tr>`;
  }).join("") : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ShelfCure Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

  <!-- ── Header ─────────────────────────────────────────────── -->
  <tr>
    <td style="background:#0f172a;border-radius:16px 16px 0 0;padding:28px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <img src="cid:logo" alt="ShelfCure" style="height:48px;width:auto;display:block;margin-bottom:8px;" />
            <div style="font-size:10px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">
              Pharmacy Management Software
            </div>
            <div style="font-size:10px;color:#475569;margin-top:3px;">
              SHELFCURE TECHNICAL SOLUTIONS PVT. LTD.
            </div>
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="font-size:11px;font-weight:700;color:#475569;letter-spacing:0.1em;text-transform:uppercase;">Invoice</div>
            <div style="font-size:15px;font-weight:800;color:#06b6d4;margin-top:3px;">${invoiceNumber}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${invoiceDate}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Bill To ─────────────────────────────────────────────── -->
  <tr>
    <td style="background:#f8fafc;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:24px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:55%;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Bill To</div>
            <div style="font-size:17px;font-weight:800;color:#0f172a;line-height:1.2;margin-bottom:4px;">${pharmacyName}</div>
            ${ownerName ? `<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:2px;">${ownerName}</div>` : ""}
            ${address ? `<div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:6px;">${address.replace(/\n/g, "<br/>")}</div>` : ""}
            ${ownerEmail ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">✉ ${ownerEmail}${showContactEmail ? ' <span style="color:#94a3b8;">(owner)</span>' : ""}</div>` : ""}
            ${showContactEmail ? `<div style="font-size:12px;color:#64748b;">✉ ${contactEmail} <span style="color:#94a3b8;">(contact)</span></div>` : ""}
            ${contactPhone ? `<div style="font-size:12px;color:#64748b;">📞 +91-${contactPhone.replace(/^\+91[-\s]?/, "").replace(/^0/, "")}</div>` : ""}
            ${gstNumber || drugLicense ? `
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">
              ${gstNumber ? `<div style="font-size:11px;color:#64748b;margin-bottom:2px;"><strong style="color:#334155;">GST:</strong> ${gstNumber}</div>` : ""}
              ${drugLicense ? `<div style="font-size:11px;color:#64748b;"><strong style="color:#334155;">Drug Lic.:</strong> ${drugLicense}</div>` : ""}
            </div>` : ""}
          </td>
          <td style="vertical-align:top;width:45%;padding-left:24px;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">License Key</div>
            <div style="background:#0f172a;border-radius:10px;padding:14px 16px;">
              <div style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;color:#06b6d4;letter-spacing:0.06em;word-break:break-all;line-height:1.6;">
                ${licenseKey}
              </div>
              <div style="font-size:10px;color:#475569;margin-top:6px;">
                ShelfCure → Settings → Activate License
              </div>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── Body ───────────────────────────────────────────────── -->
  <tr>
    <td style="background:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:28px 36px;">

      <!-- Greeting -->
      <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;line-height:1.7;">
        Dear <strong style="color:#0f172a;">${ownerName || pharmacyName}</strong>,<br/>
        Thank you for choosing ShelfCure. Please find your license information${hasPayment ? " and payment details" : ""} below.
        Keep this email safe — your license key is required to activate the software on each machine.
      </p>

      <!-- License Details -->
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #f1f5f9;">
          License Details
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;">License Type</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${LICENSE_TYPE_LABELS[licenseType] ?? licenseType}</td>
          </tr>
          ${plan ? `<tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Plan</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${plan}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Valid Until</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${expiryDate ? fmtDate(expiryDate) : "Lifetime (No Expiry)"}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Max Machines</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${maxMachines}</td>
          </tr>
          ${aiCredits != null && aiCredits > 0 ? `<tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">AI Credits</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${aiCredits}</td>
          </tr>` : ""}
        </table>
      </div>

      ${hasPayment ? `
      <!-- Payment Summary -->
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #f1f5f9;">
          Payment Summary
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;">Payment Plan</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${PAYMENT_TYPE_LABELS[paymentType!] ?? paymentType}</td>
          </tr>
          ${showGst ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Base Amount</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${fmt(baseAmount!)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">GST (${gstRate}%)</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${fmt(gstAmount!)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:8px;">Total (incl. GST)</td>
            <td style="padding:6px 0;font-size:16px;font-weight:800;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:8px;">${fmt(totalAmount!)}</td>
          </tr>
          ` : `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Total Amount</td>
            <td style="padding:6px 0;font-size:16px;font-weight:800;color:#0f172a;">${fmt(totalAmount!)}</td>
          </tr>
          `}
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Amount Paid</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#10b981;">${fmt(amountPaid)}</td>
          </tr>
          ${amountPending > 0 ? `<tr>
            <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Amount Pending</td>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#ef4444;">${fmt(amountPending)}</td>
          </tr>` : ""}
        </table>
        <div style="background:#f1f5f9;border-radius:999px;height:6px;overflow:hidden;margin-bottom:5px;">
          <div style="background:#10b981;height:100%;width:${paidPct}%;border-radius:999px;"></div>
        </div>
        <div style="font-size:11px;color:#94a3b8;text-align:right;">${paidPct}% collected</div>
      </div>

      <!-- EMI Schedule or single payment -->
      ${hasEmi ? `
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #f1f5f9;">
          EMI Schedule
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;border-collapse:separate;border-spacing:0;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:9px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0;">#</th>
              <th style="padding:9px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;">Amount</th>
              <th style="padding:9px 12px;font-size:11px;font-weight:700;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;">Status</th>
            </tr>
          </thead>
          <tbody>${installmentRows}</tbody>
        </table>
      </div>` : installments[0] ? `
      <div style="margin-bottom:28px;">
        <div style="background:${installments[0].paid_date ? "#f0fdf4" : "#fffbeb"};border:1px solid ${installments[0].paid_date ? "#bbf7d0" : "#fde68a"};border-radius:10px;padding:14px 18px;">
          <span style="font-size:14px;font-weight:700;color:${installments[0].paid_date ? "#15803d" : "#92400e"};">
            ${installments[0].paid_date
              ? `✓ Payment received on ${fmtDate(installments[0].paid_date)}${installments[0].payment_method ? ` via ${METHOD_LABELS[installments[0].payment_method] ?? installments[0].payment_method}` : ""}`
              : `○ Payment due on ${fmtDate(installments[0].due_date)}`}
          </span>
        </div>
      </div>` : ""}
      ` : ""}

      <!-- Download -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:22px 24px;margin-bottom:28px;text-align:center;">
        <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px;">
          Download ShelfCure${softwareVersion ? ` <span style="font-size:12px;font-weight:500;color:#94a3b8;">v${softwareVersion}</span>` : ""}
        </div>
        <div style="font-size:13px;color:#64748b;margin-bottom:18px;">
          Install ShelfCure on your computer and enter your license key to get started.
        </div>
        <a href="${downloadUrl}"
          style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 32px;border-radius:10px;letter-spacing:0.02em;">
          ⬇ Download Now
        </a>
        <div style="font-size:11px;color:#94a3b8;margin-top:12px;">
          Windows installer (.exe) · Supported on Windows 10 &amp; 11
        </div>
      </div>

      <!-- Support -->
      <div style="border-top:1px solid #f1f5f9;padding-top:20px;">
        <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:8px;">Need help?</div>
        <div style="font-size:13px;color:#64748b;line-height:1.8;">
          Email: <a href="mailto:info@shelfcure.com" style="color:#06b6d4;text-decoration:none;">info@shelfcure.com</a><br/>
          WhatsApp: <a href="https://wa.me/917064844320" style="color:#10b981;text-decoration:none;">+91 70648 44320</a>
        </div>
      </div>

    </td>
  </tr>

  <!-- ── Footer ─────────────────────────────────────────────── -->
  <tr>
    <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:12px;color:#475569;">
              © ${new Date().getFullYear()} SHELFCURE TECHNICAL SOLUTIONS PRIVATE LIMITED
            </div>
            <div style="font-size:11px;color:#334155;margin-top:3px;">
              Reg. No. 21ABQCS2873P1ZM &nbsp;·&nbsp; shelfcure.com
            </div>
          </td>
          <td align="right">
            <div style="font-size:11px;color:#334155;">
              This is a system-generated invoice.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();
    if (!licenseKey) return NextResponse.json({ error: "Missing licenseKey" }, { status: 400 });

    const supabase = createServiceClient();

    const [{ data: lic }, { data: payments }, { data: latestVersion }] = await Promise.all([
      supabase.from("desktop_licenses").select("*").eq("license_key", licenseKey).single(),
      supabase
        .from("license_payments")
        .select("id, payment_type, base_amount, gst_rate, total_amount, license_payment_installments(installment_number, amount, due_date, paid_date, payment_method, reference_id)")
        .eq("license_key", licenseKey)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("software_versions")
        .select("version, download_url")
        .eq("is_latest", true)
        .single(),
    ]);

    if (!lic) return NextResponse.json({ error: "License not found" }, { status: 404 });

    const toEmail = lic.contact_email || lic.owner_email;
    if (!toEmail) return NextResponse.json({ error: "No email address saved for this license. Add an email in Store Details or Contact Info first." }, { status: 400 });

    const rawPayment = payments?.[0] ?? null;

    const installments = rawPayment
      ? ((rawPayment.license_payment_installments as {
          installment_number: number;
          amount: number;
          due_date: string;
          paid_date: string | null;
          payment_method: string | null;
          reference_id: string | null;
        }[]) ?? []).sort((a, b) => a.installment_number - b.installment_number)
      : [];

    const amountPaid    = installments.reduce((s, i) => s + (i.paid_date ? i.amount : 0), 0);
    const amountPending = rawPayment ? rawPayment.total_amount - amountPaid : 0;

    const now = new Date();
    const invoiceDate   = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const invoiceNumber = `SC-${licenseKey.slice(-8).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    let logoBase64: string | undefined = undefined;
    let logoBuffer: Buffer | undefined = undefined;
    try {
      logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (e) {
      console.warn("Could not read logo.png for PDF generation");
    }

    const downloadUrl     = latestVersion?.download_url ?? "https://shelfcure.com/download";
    const softwareVersion = latestVersion?.version      ?? null;

    const pdfProps = {
      pharmacyName:  lic.pharmacy_name ?? "Valued Customer",
      ownerName:     (lic as any).owner_name   ?? null,
      ownerEmail:    lic.owner_email           ?? null,
      contactEmail:  lic.contact_email         ?? null,
      contactPhone:  lic.contact_phone         ?? null,
      address:       lic.address               ?? null,
      gstNumber:     (lic as any).gst_number   ?? null,
      drugLicense:   (lic as any).drug_license ?? null,
      licenseKey,
      licenseType:   lic.license_type          ?? "yearly",
      plan:          lic.plan                  ?? null,
      expiryDate:    lic.expiry_date           ?? null,
      maxMachines:   lic.max_machines          ?? 1,
      aiCredits:     (lic as any).ai_credits_total ?? lic.ai_credits ?? null,
      paymentType:   rawPayment?.payment_type        ?? null,
      baseAmount:    (rawPayment as any)?.base_amount ?? null,
      gstRate:       (rawPayment as any)?.gst_rate    ?? null,
      totalAmount:   rawPayment?.total_amount         ?? null,
      amountPaid,
      amountPending,
      installments,
      invoiceDate,
      invoiceNumber,
      downloadUrl,
      softwareVersion,
      logoBase64,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(React.createElement(InvoicePDF, pdfProps) as any);

    const html = buildEmail(pdfProps);

    const subject = rawPayment && amountPending > 0
      ? `ShelfCure Invoice & Payment Details — ${lic.pharmacy_name ?? licenseKey}`
      : `ShelfCure License Invoice — ${lic.pharmacy_name ?? licenseKey}`;

    const pdfFilename = `ShelfCure-Invoice-${invoiceNumber}.pdf`;

    const { error: sendErr } = await resend.emails.send({
      from: `ShelfCure <${process.env.EMAIL_FROM ?? "info@shelfcure.com"}>`,
      to: [toEmail],
      subject,
      html,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
        },
        ...(logoBuffer ? [{ filename: "logo.png", content: logoBuffer, contentId: "logo" }] : []),
      ],
    });

    if (sendErr) {
      console.error("Resend error:", sendErr);
      return NextResponse.json({ error: sendErr.message ?? "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (err) {
    console.error("send-invoice error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
