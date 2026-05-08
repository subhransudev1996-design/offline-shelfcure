"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Support", href: "#support" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="ShelfCure"
              width={160}
              height={44}
              className="h-9 md:h-11 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-slate-600 hover:text-brand-navy"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/trial"
              className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all ${
                scrolled
                  ? "border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white"
                  : "border-white/60 text-white hover:bg-white/10"
              }`}
            >
              Try Free
            </Link>
            <Link
              href="/checkout"
              className="text-sm font-bold px-5 py-2.5 rounded-lg bg-brand-emerald hover:bg-brand-emerald-light text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Buy ₹9,440
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className={`md:hidden p-2 rounded-lg ${
              scrolled ? "text-slate-700" : "text-white"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl">
          <div className="px-4 pt-3 pb-5 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/trial"
                className="text-center text-sm font-medium px-4 py-2.5 rounded-lg border border-brand-navy text-brand-navy"
                onClick={() => setMenuOpen(false)}
              >
                Try Free for 7 Days
              </Link>
              <Link
                href="/checkout"
                className="text-center text-sm font-bold px-4 py-2.5 rounded-lg bg-brand-emerald text-white"
                onClick={() => setMenuOpen(false)}
              >
                Buy Now — ₹9,440
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
