export type TemplateId = "greeting" | "offer" | "feature" | "plain";

export interface TemplateOpts {
  pharmacyName: string;
  subject:      string | null;
  message:      string;
  imageUrl:     string | null;
}

// ── Shared layout helpers ──────────────────────────────────────────

const FONT  = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
const NAVY  = "#0f172a";
const CYAN  = "#06b6d4";
const YEAR  = new Date().getFullYear();

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

function shell(
  heroHtml:   string,
  bodyHtml:   string,
  footerExtra = "",
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

  <!-- NAV -->
  <tr>
    <td style="background:${NAVY};border-radius:16px 16px 0 0;padding:22px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <img src="cid:logo" alt="ShelfCure" height="40" style="display:block;height:40px;width:auto;"/>
        </td>
        <td align="right" style="vertical-align:middle;">
          <span style="font-size:11px;color:#475569;letter-spacing:0.06em;text-transform:uppercase;">
            Pharmacy Management
          </span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- HERO -->
  ${heroHtml}

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:36px;">
      ${bodyHtml}
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:${NAVY};border-radius:0 0 16px 16px;padding:22px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <p style="margin:0;font-size:12px;color:#475569;">
            © ${YEAR} ShelfCure Technical Solutions Pvt. Ltd.
          </p>
          <p style="margin:4px 0 0;font-size:11px;color:#334155;">
            ✉ <a href="mailto:info@shelfcure.com" style="color:${CYAN};text-decoration:none;">info@shelfcure.com</a>
            &nbsp;·&nbsp;
            💬 <a href="https://wa.me/917064844320" style="color:#10b981;text-decoration:none;">+91 70648 44320</a>
            &nbsp;·&nbsp;
            <a href="https://offline.shelfcure.com" style="color:#94a3b8;text-decoration:none;">shelfcure.com</a>
          </p>
          ${footerExtra}
        </td>
      </tr></table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function imageBlock(imageUrl: string | null) {
  if (!imageUrl) return "";
  return `<div style="margin-top:24px;">
    <img src="${imageUrl}" alt="Attachment" style="max-width:100%;border-radius:12px;border:1px solid #e2e8f0;display:block;"/>
  </div>`;
}

function ctaButton(href: string, label: string, bg: string, color = "#ffffff") {
  return `<div style="text-align:center;margin-top:28px;">
    <a href="${href}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;letter-spacing:0.02em;">
      ${label}
    </a>
  </div>`;
}

// ── Template 1: Greeting ───────────────────────────────────────────

export function greetingTemplate({ pharmacyName, subject, message, imageUrl }: TemplateOpts) {
  const hero = `
  <tr>
    <td style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);padding:42px 36px;text-align:center;">
      <div style="font-size:52px;line-height:1;margin-bottom:14px;">🎉</div>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
        ${subject ? escHtml(subject) : "Warm Greetings!"}
      </h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">
        Dear ${escHtml(pharmacyName)} — with best wishes from the ShelfCure team
      </p>
    </td>
  </tr>`;

  const body = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#334155;">
      ${message}
    </p>
    ${imageBlock(imageUrl)}
    <div style="margin-top:32px;padding:20px 24px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
        Thank you for being a valued ShelfCure customer! 🙏
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#b45309;">
        We're always here to support your pharmacy's growth.
      </p>
    </div>`;

  return shell(hero, body);
}

// ── Template 2: Offer / Promotion ─────────────────────────────────

export function offerTemplate({ pharmacyName, subject, message, imageUrl }: TemplateOpts) {
  const hero = `
  <tr>
    <td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:42px 36px;text-align:center;">
      <div style="font-size:52px;line-height:1;margin-bottom:14px;">🎁</div>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
        ${subject ? escHtml(subject) : "Exclusive Offer For You!"}
      </h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">
        A special deal crafted just for ${escHtml(pharmacyName)}
      </p>
    </td>
  </tr>`;

  const body = `
    <div style="background:linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%);border:2px dashed #a78bfa;border-radius:14px;padding:24px 28px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.1em;">
        ✦ Limited Time Offer ✦
      </p>
      <p style="margin:0;font-size:14px;color:#4c1d95;font-weight:600;line-height:1.6;">
        ${message}
      </p>
    </div>
    ${imageBlock(imageUrl)}
    <p style="margin:18px 0 0;font-size:13px;color:#64748b;line-height:1.7;">
      To avail this offer or for more details, feel free to reach out to us:
    </p>
    ${ctaButton("https://wa.me/917064844320", "💬 Contact Us on WhatsApp", "#7c3aed")}
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Offer valid for a limited period. Terms and conditions apply.
    </p>`;

  return shell(hero, body);
}

// ── Template 3: New Feature Announcement ──────────────────────────

export function featureTemplate({ pharmacyName, subject, message, imageUrl }: TemplateOpts) {
  const hero = `
  <tr>
    <td style="background:linear-gradient(135deg,#0891b2 0%,#0f172a 100%);padding:42px 36px;text-align:center;">
      <div style="font-size:52px;line-height:1;margin-bottom:14px;">✨</div>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
        ${subject ? escHtml(subject) : "New Features in ShelfCure!"}
      </h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">
        Hi ${escHtml(pharmacyName)} — here's what's new for you
      </p>
    </td>
  </tr>`;

  const body = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#334155;">
      ${message}
    </p>
    ${imageBlock(imageUrl)}
    <div style="margin-top:28px;display:flex;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:18px 22px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0369a1;">📥 Update Available</p>
            <p style="margin:0;font-size:12px;color:#0c4a6e;line-height:1.6;">
              Open ShelfCure on your computer and click <strong>Help → Check for Updates</strong> to get the latest version.
            </p>
          </td>
        </tr>
      </table>
    </div>
    ${ctaButton("https://offline.shelfcure.com/download", "⬇ Download Latest Version", "#0891b2")}`;

  return shell(hero, body,
    `<p style="margin:8px 0 0;font-size:10px;color:#334155;">
       Update your ShelfCure app to enjoy the latest features and improvements.
     </p>`
  );
}

// ── Template 4: Plain (default) ────────────────────────────────────

export function plainTemplate({ pharmacyName, subject, message, imageUrl }: TemplateOpts) {
  const hero = `
  <tr>
    <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:36px;text-align:center;border-bottom:3px solid ${CYAN};">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
        ${subject ? escHtml(subject) : "A message from ShelfCure"}
      </h1>
      <p style="margin:6px 0 0;font-size:13px;color:#64748b;">To: ${escHtml(pharmacyName)}</p>
    </td>
  </tr>`;

  const body = `
    <p style="margin:0;font-size:15px;line-height:1.75;color:#334155;">
      ${message}
    </p>
    ${imageBlock(imageUrl)}`;

  return shell(hero, body);
}

// ── Dispatcher ─────────────────────────────────────────────────────

export function buildEmailHtml(templateId: TemplateId, opts: TemplateOpts): string {
  switch (templateId) {
    case "greeting": return greetingTemplate(opts);
    case "offer":    return offerTemplate(opts);
    case "feature":  return featureTemplate(opts);
    default:         return plainTemplate(opts);
  }
}

// ── Template metadata (used by the UI) ────────────────────────────

export const TEMPLATE_DEFS = [
  {
    id:          "greeting" as TemplateId,
    label:       "Greeting",
    emoji:       "🎉",
    description: "Festive or warm greeting",
    accent:      "#f59e0b",
    bg:          "#fef3c7",
    defaultSubject: "Warm Greetings from ShelfCure!",
    defaultMessage:
`Dear [Pharmacy Name],

Warm greetings from the entire ShelfCure team! 🎉

We hope your pharmacy is doing great and your business is growing every day. It's always a pleasure to have you as a valued ShelfCure customer.

We are committed to making your pharmacy management easier, faster, and smarter — so you can focus on what matters most: taking care of your customers.

If you ever need any help, training, or support, we are just a call or message away.

With warm regards,
Team ShelfCure
📞 7064844320
✉ info@shelfcure.com
🌐 offline.shelfcure.com`,
  },
  {
    id:          "offer" as TemplateId,
    label:       "Special Offer",
    emoji:       "🎁",
    description: "Promotion or discount",
    accent:      "#7c3aed",
    bg:          "#f5f3ff",
    defaultSubject: "Exclusive Offer on ShelfCure — Smart Pharmacy, Better Business!",
    defaultMessage:
`Dear [Pharmacy Name],

We have an exciting offer exclusively for you! 🎁

🏆 ShelfCure — Smart Pharmacy Management Software

✅ What you get:
• Complete Billing & Inventory Management
• AI Purchase Bill Scanning (Instantly extract data from bills)
• Sales, Purchase & Stock Reports
• Customer & Supplier Management
• 100% Offline — No Internet Required
• Free Updates & Dedicated Support

💰 Special Offer Pricing:
• One-Time Payment: ₹3,999 + GST
• Easy EMI: ₹787/month × 6 months = ₹4,000 + GST

🎯 Only for the first 100 customers — don't miss out!

To avail this offer, contact us today:
📞 7064844320
💬 WhatsApp: 7064844320
🌐 offline.shelfcure.com
📍 Bhubaneswar, Odisha`,
  },
  {
    id:          "feature" as TemplateId,
    label:       "New Feature",
    emoji:       "✨",
    description: "Update or new release",
    accent:      "#0891b2",
    bg:          "#f0f9ff",
    defaultSubject: "What's New in ShelfCure — New Features Just for You!",
    defaultMessage:
`Dear [Pharmacy Name],

We're excited to share what's new in ShelfCure! ✨

🚀 New Features in This Update:
• [Feature 1 — describe it here]
• [Feature 2 — describe it here]
• [Feature 3 — describe it here]

🛠 Improvements & Bug Fixes:
• Faster billing and stock loading
• Better print formatting for invoices
• Improved search across medicines

📥 How to Update:
Open ShelfCure on your computer and go to:
Help → Check for Updates

Or download the latest version from offline.shelfcure.com/download

Need help with the update?
📞 7064844320
✉ info@shelfcure.com`,
  },
  {
    id:          "plain" as TemplateId,
    label:       "Plain",
    emoji:       "✉️",
    description: "Simple branded email",
    accent:      "#0f172a",
    bg:          "#f8fafc",
    defaultSubject: "",
    defaultMessage: "",
  },
] as const;
