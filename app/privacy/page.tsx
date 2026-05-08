import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Privacy Policy — ShelfCure" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="ShelfCure" width={120} height={33} className="h-8 w-auto" /></Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-brand-navy">← Back to Home</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
        <h1>Privacy Policy</h1>
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <h2>1. Information We Collect</h2>
        <p>When you purchase or request a trial for ShelfCure, we collect your name, email address, mobile number, and optionally your GSTIN. We also collect payment information processed securely by Razorpay — we do not store your card details.</p>
        <h2>2. How We Use Your Information</h2>
        <p>We use your information to: deliver your license key and software download link, send product updates, respond to support requests, and generate your GST invoice. We do not sell your data to third parties.</p>
        <h2>3. Data Storage</h2>
        <p>Your purchase data is stored securely in Supabase (PostgreSQL) hosted on AWS infrastructure. Payment records are maintained as required for GST compliance.</p>
        <h2>4. Cookies</h2>
        <p>We use minimal cookies required for authentication (admin panel) and session management. We do not use advertising or tracking cookies.</p>
        <h2>5. Contact</h2>
        <p>For any privacy-related queries, contact us at <a href="mailto:support@shelfcure.com">support@shelfcure.com</a>.</p>
      </div>
    </div>
  );
}
