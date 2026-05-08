import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

function getLogoAttachment() {
  try {
    const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    return {
      filename: "logo.png",
      content: logoBuffer,
      contentId: "logo",
    };
  } catch (e) {
    return null;
  }
}
const FROM = process.env.EMAIL_FROM || "noreply@shelfcure.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "support@shelfcure.com";

interface PurchaseEmailData {
  customerName: string;
  email: string;
  licenseKey: string;
  downloadUrl: string;
  version: string;
  orderId: string;
  amountBase: number;
  amountGst: number;
  amountTotal: number;
  gstin?: string;
}

export async function sendPurchaseConfirmation(data: PurchaseEmailData) {
  const { customerName, email, licenseKey, downloadUrl, version, orderId, amountBase, amountGst, amountTotal } = data;
  const logoAttachment = getLogoAttachment();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "✓ Your ShelfCure License — Order Confirmed",
    attachments: logoAttachment ? [logoAttachment] : [],
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f1f5c,#1E3A8A);padding:40px 32px;text-align:center;">
      <img src="cid:logo" alt="ShelfCure" style="height:48px;width:auto;display:inline-block;margin-bottom:16px;" />
      <div style="color:#10B981;font-size:48px;margin-bottom:8px;">✓</div>
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Payment Confirmed!</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Your ShelfCure lifetime license is ready</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">Dear <strong>${customerName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
        Thank you for purchasing ShelfCure! Your payment has been confirmed and your lifetime license key is ready below.
      </p>

      <!-- License Key Box -->
      <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your License Key</p>
        <div style="color:#10B981;font-family:'Courier New',monospace;font-size:18px;font-weight:700;letter-spacing:3px;">
          ${licenseKey}
        </div>
        <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">Keep this safe — you'll need it to activate ShelfCure</p>
      </div>

      <!-- Download Button -->
      ${downloadUrl ? `
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${downloadUrl}" style="display:inline-block;background:#10B981;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          ⬇ Download ShelfCure v${version}
        </a>
      </div>
      ` : ""}

      <!-- Steps -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="font-weight:700;color:#1e293b;margin:0 0 12px;font-size:14px;">How to get started:</p>
        <div style="color:#475569;font-size:13px;line-height:1.6;">
          <div style="margin-bottom:8px;">1️⃣ Download the installer from the link above</div>
          <div style="margin-bottom:8px;">2️⃣ Run <strong>ShelfCure_setup.exe</strong> and follow setup</div>
          <div style="margin-bottom:8px;">3️⃣ Open ShelfCure → click <strong>Activate License</strong></div>
          <div>4️⃣ Enter your license key and you're ready to bill!</div>
        </div>
      </div>

      <!-- Invoice Summary -->
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
        <p style="font-weight:700;color:#1e293b;margin:0 0 12px;font-size:14px;">Payment Receipt</p>
        <table style="width:100%;font-size:13px;color:#475569;border-collapse:collapse;">
          <tr><td style="padding:4px 0;">ShelfCure Desktop (Lifetime)</td><td style="text-align:right;">₹${amountBase.toLocaleString("en-IN")}</td></tr>
          <tr><td style="padding:4px 0;">GST (18%)</td><td style="text-align:right;">₹${amountGst.toLocaleString("en-IN")}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;font-weight:700;color:#1e293b;"><td style="padding:10px 0 4px;">Total Paid</td><td style="text-align:right;padding:10px 0 4px;">₹${amountTotal.toLocaleString("en-IN")}</td></tr>
        </table>
        <p style="font-size:11px;color:#94a3b8;margin:8px 0 0;">Order ID: ${orderId}</p>
      </div>

      <!-- Support -->
      <div style="text-align:center;padding:16px;background:#f0fdf4;border-radius:12px;">
        <p style="color:#166534;font-size:13px;margin:0;">Need help? WhatsApp or email us at <a href="mailto:support@shelfcure.com" style="color:#166534;font-weight:600;">support@shelfcure.com</a></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ShelfCure · Made for Indian Pharmacies 🇮🇳</p>
    </div>
  </div>
</body>
</html>
    `,
  });

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `💰 New Purchase — ${customerName} — ₹${amountTotal.toLocaleString("en-IN")}`,
    text: `New purchase!\n\nCustomer: ${customerName}\nEmail: ${email}\nOrder ID: ${orderId}\nAmount: ₹${amountTotal}\nLicense: ${licenseKey}`,
  });
}

interface TrialEmailData {
  name: string;
  email: string;
  trialKey: string;
  expiresAt: string;
  downloadUrl: string;
  version: string;
}

export async function sendTrialWelcome(data: TrialEmailData) {
  const { name, email, trialKey, expiresAt, downloadUrl, version } = data;
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const telegramLink = botUsername ? `https://t.me/${botUsername}?start=${trialKey}` : "";

  const logoAttachment = getLogoAttachment();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your 7-Day ShelfCure Trial Starts Now 🚀",
    attachments: logoAttachment ? [logoAttachment] : [],
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f1f5c,#1E3A8A);padding:40px 32px;text-align:center;">
      <img src="cid:logo" alt="ShelfCure" style="height:48px;width:auto;display:inline-block;margin-bottom:16px;" />
      <div style="color:#0EA5E9;font-size:48px;margin-bottom:8px;">🚀</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Your Trial is Live!</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">7 days of full ShelfCure access — starts now</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">Your 7-day free trial is active. Use the trial key below to get started.</p>

      <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
        <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Trial License Key</p>
        <div style="color:#0EA5E9;font-family:'Courier New',monospace;font-size:18px;font-weight:700;letter-spacing:2px;">${trialKey}</div>
        <p style="color:#ef4444;font-size:12px;margin:12px 0 0;">⏰ Expires: ${expiryDate}</p>
      </div>

      ${downloadUrl ? `<div style="text-align:center;margin:24px 0;"><a href="${downloadUrl}" style="display:inline-block;background:#0EA5E9;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">⬇ Download ShelfCure v${version}</a></div>` : ""}

      ${telegramLink ? `
      <div style="background:#e8f4fd;border:1px solid #b3d9f2;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#0f5c87;font-size:13px;font-weight:700;margin:0 0 6px;">📱 Get setup tips on Telegram</p>
        <p style="color:#4a90b8;font-size:12px;margin:0 0 12px;">Our bot will guide you through setup and send helpful reminders during your trial.</p>
        <a href="${telegramLink}" style="display:inline-block;background:#229ED9;color:#fff;font-weight:700;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;">Open ShelfCure Bot on Telegram</a>
      </div>
      ` : ""}

      <div style="background:#eff6ff;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
        <p style="color:#1d4ed8;font-size:14px;font-weight:600;margin:0 0 8px;">Ready to go lifetime?</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/checkout" style="display:inline-block;background:#1E3A8A;color:#fff;font-weight:700;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;">Buy Lifetime License — ₹9,440</a>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;">Questions? <a href="mailto:support@shelfcure.com" style="color:#1E3A8A;">support@shelfcure.com</a></p>
    </div>
  </div>
</body>
</html>
    `,
  });
}

interface PaymentLinkEmailData {
  email: string;
  pharmacyName: string;
  paymentLink: string;
}

export async function sendPaymentLink(data: PaymentLinkEmailData) {
  const { email, pharmacyName, paymentLink } = data;

  const logoAttachment = getLogoAttachment();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Complete your ShelfCure Lifetime License Payment",
    attachments: logoAttachment ? [logoAttachment] : [],
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f1f5c,#1E3A8A);padding:40px 32px;text-align:center;">
      <img src="cid:logo" alt="ShelfCure" style="height:48px;width:auto;display:inline-block;margin-bottom:16px;" />
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Complete Your Payment</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Secure Razorpay Payment Link for ShelfCure</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">Dear <strong>${pharmacyName || 'Customer'}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6;">
        Please click the button below to complete your payment for the ShelfCure Lifetime License. Once the payment is confirmed, your lifetime license key will be generated and sent to you automatically.
      </p>

      <!-- Pay Button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${paymentLink}" style="display:inline-block;background:#10B981;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          💳 Pay Now Securely
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
        If the button doesn't work, copy and paste this link in your browser:<br/>
        <a href="${paymentLink}" style="color:#1E3A8A;word-break:break-all;">${paymentLink}</a>
      </p>

      <!-- Support -->
      <div style="text-align:center;padding:16px;background:#f0fdf4;border-radius:12px;margin-top:24px;">
        <p style="color:#166534;font-size:13px;margin:0;">Need help? WhatsApp or email us at <a href="mailto:support@shelfcure.com" style="color:#166534;font-weight:600;">support@shelfcure.com</a></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ShelfCure · Made for Indian Pharmacies 🇮🇳</p>
    </div>
  </div>
</body>
</html>
    `,
  });
}
