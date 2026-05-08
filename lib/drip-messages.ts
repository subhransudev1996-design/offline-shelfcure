const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shelfcure.com";
const WHATSAPP = process.env.WHATSAPP_NUMBER || "917064844320";

export interface TrialContext {
  name: string;
  trialKey: string;
  expiresAt: string;
  downloadUrl: string;
}

function expiryText(expiresAt: string): string {
  return new Date(expiresAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Day 0 — sent immediately when user connects the bot
export function day0(ctx: TrialContext): string {
  return `👋 <b>Hi ${ctx.name}!</b>

Welcome to ShelfCure! Your 7-day free trial is active and ready to use.

🔑 <b>Your Trial Key:</b>
<code>${ctx.trialKey}</code>

⏰ Expires: <b>${expiryText(ctx.expiresAt)}</b>

<b>Get started in 3 steps:</b>
1️⃣ Download ShelfCure: ${ctx.downloadUrl || `${SITE}/download`}
2️⃣ Install on your Windows PC
3️⃣ Click <b>Activate License</b> → enter your trial key

I'll check in every couple of days with tips to help you get the most out of ShelfCure.

Questions? Just type them here — I'll help you out! 💬`;
}

// Day 2 — setup tips
export function day2(ctx: TrialContext): string {
  return `💡 <b>Quick tips for ${ctx.name}!</b>

Hope you've started exploring ShelfCure. Here are the 3 things every pharmacy sets up first:

<b>1. Import your medicine list</b>
Go to Inventory → Bulk Import → upload your Excel sheet. Saves hours of manual entry!

<b>2. Connect your barcode scanner</b>
Works with any USB barcode scanner — plug in and it's ready.

<b>3. Set up GST details</b>
Settings → Business Info → add your GSTIN. All bills will auto-generate with GST.

⏰ <b>${expiryText(ctx.expiresAt)}</b> is your trial expiry — ${5} days left.

Need help with any of these? Just ask below 👇`;
}

// Day 5 — upgrade nudge (2 days left)
export function day5(ctx: TrialContext): string {
  return `⏰ <b>2 days left, ${ctx.name}!</b>

Pharmacies using ShelfCure save <b>2+ hours every day</b> on billing and stock management.

💰 <b>Lifetime License — ₹9,440</b>
(That's just ₹26/day, forever — no renewal fees!)

✅ What you get:
• Unlimited billing, no monthly fee
• GST billing & GSTR1 export
• Inventory + purchase management
• Barcode POS billing
• Free updates for life
• WhatsApp support

👉 <b>Buy now:</b> ${SITE}/checkout

💬 Want to talk first? WhatsApp us:
https://wa.me/${WHATSAPP}`;
}

// Day 7 — trial expiry
export function day7(ctx: TrialContext): string {
  return `😢 <b>${ctx.name}, your trial ends today!</b>

Don't lose the billing history and medicine data you've built up.

Upgrade now and <b>continue right where you left off</b> — all your data is preserved.

👉 <b>Buy lifetime license (₹9,440):</b>
${SITE}/checkout

⚡ Takes 2 minutes — license key is emailed instantly after payment.

Need more time to decide? Reply <b>EXTEND</b> and we'll give you 3 more days to try.

📞 Questions? WhatsApp: https://wa.me/${WHATSAPP}`;
}

// Day 10 — final offer (3 days post-expiry)
export function day10(ctx: TrialContext): string {
  return `👋 <b>${ctx.name}, we miss you!</b>

Your trial ended a few days ago. We'd love to have you on board.

🎁 <b>Special offer — ₹500 off</b>
Mention <b>TELEGRAM500</b> when you WhatsApp us and we'll apply the discount.

👉 Contact us to buy:
https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20want%20to%20buy%20ShelfCure.%20Code%3A%20TELEGRAM500

Or buy directly: ${SITE}/checkout

This offer is valid for <b>48 hours</b> only. After that, the price goes back to ₹9,440.

We're here to help you make the switch — just say the word! 🙌`;
}

// Step number → message builder map
export const DRIP_STEPS: Record<number, (ctx: TrialContext) => string> = {
  0: day0,
  2: day2,
  5: day5,
  7: day7,
  10: day10,
};

// Which steps fire on which day (inclusive)
export const STEP_DAY_MAP: Record<number, number> = {
  0: 0,
  2: 2,
  5: 5,
  7: 7,
  10: 10,
};
