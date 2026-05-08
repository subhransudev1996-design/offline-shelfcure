"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ravi Kumar",
    role: "Owner",
    pharmacy: "Shri Ram Medical Store",
    location: "Delhi",
    initials: "RK",
    color: "from-brand-cyan to-brand-navy",
    rating: 5,
    text: "ShelfCure has completely transformed how I run my pharmacy. The GSTR1 export alone saves me 3 hours every month. The POS is so fast my staff loves it. Best investment I've made for my shop.",
  },
  {
    name: "Priya Sharma",
    role: "Pharmacist & Owner",
    pharmacy: "HealthFirst Pharmacy",
    location: "Mumbai",
    initials: "PS",
    color: "from-brand-emerald to-brand-cyan",
    rating: 5,
    text: "After using ShelfCure for 6 months, I can track every medicine batch, expiry date, and profit margin without any effort. The AI bill scanning feature is incredible — I scan a supplier bill in seconds.",
  },
  {
    name: "Mohammed Aziz",
    role: "Proprietor",
    pharmacy: "Al-Shifa Medicals",
    location: "Hyderabad",
    initials: "MA",
    color: "from-violet-500 to-brand-cyan",
    rating: 5,
    text: "The offline-first approach is a game changer. My internet goes down sometimes but ShelfCure always works. The WhatsApp billing feature is loved by my customers — they get their bills instantly.",
  },
  {
    name: "Gurpreet Singh",
    role: "Retail Pharmacist",
    pharmacy: "Singh Medicos",
    location: "Chandigarh",
    initials: "GS",
    color: "from-orange-500 to-brand-emerald",
    rating: 5,
    text: "I was using a subscription-based software that cost me ₹4,000 every year. Switching to ShelfCure was the best decision — paid once, now saving money year after year. Support team is very responsive too.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-brand-cyan text-sm font-semibold tracking-widest uppercase mb-3">
            Customer Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Trusted by Pharmacies Across India
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-xl mx-auto">
            See what pharmacy owners and pharmacists say about ShelfCure.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Quote icon */}
              <Quote
                size={40}
                className="absolute top-4 right-4 text-slate-100"
                fill="currentColor"
              />

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, si) => (
                  <Star key={si} size={14} className="text-yellow-400" fill="currentColor" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-slate-700 text-sm leading-relaxed mb-6 relative z-10">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-slate-400 text-xs">
                    {t.role} · {t.pharmacy}, {t.location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-400 text-sm mb-4">
            Join 100+ pharmacies across India already using ShelfCure
          </p>
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-yellow-400" fill="currentColor" />
            ))}
            <span className="ml-2 text-slate-600 text-sm font-semibold">4.9 / 5</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
