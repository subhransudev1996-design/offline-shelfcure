"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is this a one-time payment or a subscription?",
    a: "ShelfCure is a one-time payment of ₹9,440 (₹8,000 + 18% GST). You pay once and own the software forever. There are no monthly or annual fees — ever.",
  },
  {
    q: "What does 'lifetime free updates' include?",
    a: "All standard updates — bug fixes, new features, GST rule changes, UI improvements — are delivered free via email for the lifetime of your license. Major platform rewrites (if any) may be offered at a discounted upgrade price.",
  },
  {
    q: "Can I use ShelfCure on multiple computers?",
    a: "Your license is for one computer (one installation). If you need to move to a new computer, contact our support team — we'll help you transfer the license.",
  },
  {
    q: "Is ShelfCure GST-compliant?",
    a: "Yes. ShelfCure includes full GST billing support with correct CGST/SGST/IGST calculation, HSN code support, and GSTR1 Excel export that you can directly upload to the GST portal.",
  },
  {
    q: "What happens after I pay?",
    a: "Within minutes of payment confirmation, you'll receive an email with your unique license key and a download link for the installer. Install it on your Windows PC, enter the license key, and you're ready to start billing.",
  },
  {
    q: "How does the 7-day free trial work?",
    a: "The trial gives you full access to ShelfCure for 7 days with a time-limited trial license key. After 7 days, the trial expires and you'll need to purchase a full license to continue using the software.",
  },
  {
    q: "What operating systems does ShelfCure support?",
    a: "ShelfCure runs on Windows 10 and Windows 11 (64-bit). It does not currently support Mac or Linux. An internet connection is not required for day-to-day use.",
  },
  {
    q: "How do I get support if I have a problem?",
    a: "You can reach our support team via WhatsApp or email. We typically respond within a few hours during business hours (9 AM–7 PM IST, Mon–Sat).",
  },
  {
    q: "What is your refund policy?",
    a: "Since ShelfCure is software that can be downloaded and used immediately, we generally do not offer refunds after the license key has been issued. However, if you face a technical issue we cannot resolve, we'll work with you to find a fair solution. We strongly recommend using the free 7-day trial first.",
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        onClick={onToggle}
      >
        <span className={`text-sm font-semibold transition-colors ${isOpen ? "text-brand-navy" : "text-slate-800 group-hover:text-brand-navy"}`}>
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-navy" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-slate-500 text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-slate-50 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-500">
            Everything you need to know before buying.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </motion.div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-500 text-sm">
            Still have questions?{" "}
            <a
              href="#support"
              className="text-brand-navy font-semibold hover:underline"
            >
              Contact our support team →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
