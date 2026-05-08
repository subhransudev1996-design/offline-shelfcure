import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  one_time:      "One-time Payment",
  "3_month_emi": "3-Month EMI",
  "6_month_emi": "6-Month EMI",
};

function fmt(amount: number) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function buildReminderEmail(data: {
  pharmacyName: string;
  licenseKey: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paymentType: string;
  totalAmount: number;
  amountPaid: number;
}) {
  const {
    pharmacyName, licenseKey, installmentNumber,
    totalInstallments, amount, dueDate,
    paymentType, totalAmount, amountPaid,
  } = data;

  const amountPending = totalAmount - amountPaid;
  const paidPct = Math.min(Math.round((amountPaid / totalAmount) * 100), 100);
  const formattedDue = fmtDate(dueDate);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>EMI Payment Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;border-radius:16px 16px 0 0;padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                    Shelf<span style="color:#06b6d4;">Cure</span>
                  </div>
                  <div style="font-size:12px;color:#94a3b8;margin-top:4px;letter-spacing:0.05em;">
                    PHARMACY MANAGEMENT SOFTWARE
                  </div>
                </td>
                <td align="right">
                  <div style="background:#f59e0b;color:#ffffff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;white-space:nowrap;">
                    ⏰ Payment Due in 3 Days
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px 36px;">

            <!-- Greeting -->
            <p style="margin:0 0 6px 0;font-size:14px;color:#64748b;">Dear,</p>
            <p style="margin:0 0 20px 0;font-size:20px;font-weight:700;color:#0f172a;">${pharmacyName}</p>
            <p style="margin:0 0 28px 0;font-size:14px;color:#64748b;line-height:1.6;">
              This is a friendly reminder that your EMI installment for ShelfCure is due in
              <strong style="color:#0f172a;">3 days</strong>. Please arrange the payment before the due date to avoid any interruption to your service.
            </p>

            <!-- Due Amount Box -->
            <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:14px;padding:24px 28px;margin-bottom:28px;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">
                Amount Due
              </div>
              <div style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:4px;">
                ${fmt(amount)}
              </div>
              <div style="font-size:14px;color:#78350f;font-weight:600;">
                Installment ${installmentNumber} of ${totalInstallments} &nbsp;·&nbsp; Due on ${formattedDue}
              </div>
            </div>

            <!-- License Key -->
            <div style="background:#0f172a;border-radius:12px;padding:16px 24px;margin-bottom:28px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">
                License Key
              </div>
              <div style="font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:700;color:#06b6d4;letter-spacing:0.08em;word-break:break-all;">
                ${licenseKey}
              </div>
            </div>

            <!-- Payment Summary -->
            <div style="margin-bottom:28px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f1f5f9;">
                Payment Plan Summary
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#94a3b8;width:50%;">Payment Plan</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;">${PAYMENT_TYPE_LABELS[paymentType] ?? paymentType}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Total Amount</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;">${fmt(totalAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Amount Paid So Far</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:600;color:#10b981;">${fmt(amountPaid)}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Remaining (incl. this)</td>
                  <td style="padding:7px 0;font-size:13px;font-weight:600;color:#ef4444;">${fmt(amountPending)}</td>
                </tr>
              </table>

              <!-- Progress bar -->
              <div style="background:#f1f5f9;border-radius:999px;height:8px;overflow:hidden;margin-bottom:6px;">
                <div style="background:#10b981;height:100%;width:${paidPct}%;border-radius:999px;"></div>
              </div>
              <div style="font-size:11px;color:#94a3b8;text-align:right;">${paidPct}% paid</div>
            </div>

            <!-- Payment methods note -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
              <div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:6px;">How to pay?</div>
              <div style="font-size:13px;color:#3b82f6;line-height:1.7;">
                Contact your ShelfCure representative or reach us via WhatsApp / email to confirm your payment.
                Once paid, we will update your account automatically.
              </div>
            </div>

            <!-- Support -->
            <div style="border-top:1px solid #f1f5f9;padding-top:20px;">
              <div style="font-size:13px;font-weight:600;color:#0f172a;margin-bottom:8px;">Need help?</div>
              <div style="font-size:13px;color:#64748b;line-height:1.7;">
                Email us at <a href="mailto:info@shelfcure.com" style="color:#06b6d4;text-decoration:none;">info@shelfcure.com</a><br/>
                WhatsApp: <a href="https://wa.me/917064844320" style="color:#10b981;text-decoration:none;">+91 70648 44320</a>
              </div>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:12px;color:#475569;">
                    © ${new Date().getFullYear()} ShelfCure. All rights reserved.
                  </div>
                  <div style="font-size:11px;color:#334155;margin-top:4px;">
                    This is an automated reminder sent 3 days before your EMI due date.
                  </div>
                </td>
                <td align="right">
                  <div style="font-size:11px;color:#334155;">shelfcure.com</div>
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

export async function GET(req: NextRequest) {
  // Verify this was called by Vercel Cron (or an authorized internal request)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createServiceClient();

    // Target date: 3 days from today
    const target = new Date();
    target.setDate(target.getDate() + 3);
    const targetDate = target.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Fetch all unpaid installments due exactly 3 days from now
    const { data: installments, error: instErr } = await supabase
      .from("license_payment_installments")
      .select("id, license_key, installment_number, amount, due_date, payment_id")
      .eq("due_date", targetDate)
      .is("paid_date", null);

    if (instErr) {
      console.error("emi-reminder: fetch installments error", instErr);
      return NextResponse.json({ error: instErr.message }, { status: 500 });
    }

    if (!installments?.length) {
      return NextResponse.json({ success: true, sent: 0, message: "No installments due in 3 days" });
    }

    // Batch-fetch all unique payment plans and licenses needed
    const paymentIds   = [...new Set(installments.map((i) => i.payment_id))];
    const licenseKeys  = [...new Set(installments.map((i) => i.license_key))];

    const [{ data: payments }, { data: licenses }] = await Promise.all([
      supabase
        .from("license_payments")
        .select("id, license_key, payment_type, total_amount, license_payment_installments(paid_date, amount)")
        .in("id", paymentIds),
      supabase
        .from("desktop_licenses")
        .select("license_key, pharmacy_name, contact_email, status")
        .in("license_key", licenseKeys),
    ]);

    const paymentMap = Object.fromEntries((payments ?? []).map((p) => [p.id, p]));
    const licenseMap = Object.fromEntries((licenses ?? []).map((l) => [l.license_key, l]));

    let sent = 0;
    const errors: string[] = [];

    for (const inst of installments) {
      const lic     = licenseMap[inst.license_key];
      const payment = paymentMap[inst.payment_id];

      // Skip suspended licenses or missing data
      if (!lic || !payment) continue;
      if (lic.status !== "active") continue;

      const contactEmail = lic.contact_email;
      if (!contactEmail) continue;

      // Calculate amount paid so far from sibling installments
      const sibs = (payment.license_payment_installments as { paid_date: string | null; amount: number }[]) ?? [];
      const totalInstallments = sibs.length;
      const amountPaid = sibs.reduce((s, i) => s + (i.paid_date ? i.amount : 0), 0);

      const html = buildReminderEmail({
        pharmacyName:       lic.pharmacy_name ?? "Valued Customer",
        licenseKey:         inst.license_key,
        installmentNumber:  inst.installment_number,
        totalInstallments,
        amount:             inst.amount,
        dueDate:            inst.due_date,
        paymentType:        payment.payment_type,
        totalAmount:        payment.total_amount,
        amountPaid,
      });

      const subject = `⏰ EMI Reminder: ${fmt(inst.amount)} due on ${fmtDate(inst.due_date)} — ${lic.pharmacy_name ?? inst.license_key}`;

      const { error: sendErr } = await resend.emails.send({
        from: `ShelfCure <${process.env.EMAIL_FROM ?? "info@shelfcure.com"}>`,
        to: [contactEmail],
        subject,
        html,
      });

      if (sendErr) {
        console.error(`emi-reminder: failed to send to ${contactEmail}`, sendErr);
        errors.push(`${contactEmail}: ${sendErr.message}`);
      } else {
        sent++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: installments.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error("emi-reminder error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
