"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Mail, Download, Key, ArrowRight } from "lucide-react";

const steps = [
  { icon: Mail, title: "Check your email", desc: "Your license key and download link have been sent to your email address." },
  { icon: Download, title: "Download the installer", desc: "Click the download link in your email to get the ShelfCure installer (.exe)." },
  { icon: Key, title: "Enter your license key", desc: "After installing, open ShelfCure and enter your license key to activate." },
];

export default function SuccessContent() {
  const params = useSearchParams();
  const licenseKey = params.get("license") || "";
  const email = params.get("email") || "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="ShelfCure" width={140} height={38} className="h-10 w-auto" />
        </div>

        {/* Success card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-r from-brand-emerald to-brand-emerald-light p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful! 🎉</h1>
            <p className="mt-2 text-white/80 text-sm">
              Your ShelfCure lifetime license is ready
            </p>
          </div>

          {/* Body */}
          <div className="p-7">
            {/* License key display */}
            {licenseKey && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Your License Key</p>
                <div className="bg-slate-900 text-brand-emerald font-mono text-base font-bold px-5 py-4 rounded-xl text-center tracking-widest select-all">
                  {licenseKey}
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Also sent to {email && <span className="font-medium text-slate-600">{email}</span>}
                </p>
              </div>
            )}

            {/* Next steps */}
            <div className="space-y-4 mb-7">
              <p className="text-sm font-semibold text-slate-700">Next Steps:</p>
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center shrink-0">
                    <s.icon size={15} className="text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <Link
                href="mailto:support@shelfcure.com"
                className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 rounded-xl text-slate-600 hover:border-brand-navy hover:text-brand-navy text-sm font-medium transition-all"
              >
                <Mail size={15} /> Contact Support
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-3 text-slate-400 hover:text-slate-600 text-sm transition-all"
              >
                Back to Home <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <a href="mailto:support@shelfcure.com" className="text-brand-navy hover:underline">
            contact us
          </a>
        </p>
      </div>
    </div>
  );
}
