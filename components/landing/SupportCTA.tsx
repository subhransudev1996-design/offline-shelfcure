"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mail, Clock, CheckCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

export default function SupportCTA() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="support" className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            Support
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            We&apos;re Here to Help
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            Have a question before buying? Need help setting up? Our team is available via WhatsApp and email.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Contact options */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20have%20a%20question%20about%20ShelfCure`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-2xl hover:border-green-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="text-white" fill="white" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors">
                  Chat on WhatsApp
                </div>
                <div className="text-slate-500 text-sm">Usually responds within 30 minutes</div>
              </div>
              <div className="ml-auto text-green-500 font-bold text-sm">Open →</div>
            </a>

            {/* Email */}
            <a
              href="mailto:support@shelfcure.com"
              className="flex items-center gap-4 p-5 bg-brand-navy/5 border border-brand-navy/20 rounded-2xl hover:border-brand-navy/40 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-brand-navy rounded-xl flex items-center justify-center shrink-0">
                <Mail size={22} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 group-hover:text-brand-navy transition-colors">
                  support@shelfcure.com
                </div>
                <div className="text-slate-500 text-sm">We respond within a few hours</div>
              </div>
            </a>

            {/* Hours */}
            <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={22} className="text-slate-500" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Support Hours</div>
                <div className="text-slate-500 text-sm">Mon–Sat, 9:00 AM – 7:00 PM IST</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-5">Send us a Message</h3>

              {status === "sent" ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <CheckCircle size={40} className="text-brand-emerald" />
                  <p className="font-semibold text-slate-900">Message sent!</p>
                  <p className="text-slate-500 text-sm">We&apos;ll get back to you within a few hours.</p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-brand-navy text-sm font-medium hover:underline mt-2"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ravi Kumar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="ravi@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="I have a question about..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 outline-none text-sm resize-none transition-all"
                    />
                  </div>
                  {status === "error" && (
                    <p className="text-red-500 text-xs">Something went wrong. Please try WhatsApp instead.</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full py-3 bg-brand-navy hover:bg-brand-navy-light text-white font-semibold rounded-xl transition-all disabled:opacity-60"
                  >
                    {status === "sending" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
