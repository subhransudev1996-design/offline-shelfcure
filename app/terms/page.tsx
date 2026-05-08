import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Terms of Service — ShelfCure" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="ShelfCure" width={120} height={33} className="h-8 w-auto" /></Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-brand-navy">← Back to Home</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
        <h1>Terms of Service</h1>
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <h2>1. License Grant</h2>
        <p>Upon purchase, ShelfCure grants you a non-transferable, non-exclusive license to install and use the software on one computer. This is a lifetime license — no renewal is required.</p>
        <h2>2. Permitted Use</h2>
        <p>You may use ShelfCure for managing one pharmacy business. You may not redistribute, resell, or sublicense the software.</p>
        <h2>3. Updates</h2>
        <p>Standard updates (bug fixes, new features, GST changes) are provided free of charge for the lifetime of your license. We reserve the right to charge for major platform rewrites.</p>
        <h2>4. Limitation of Liability</h2>
        <p>ShelfCure is provided "as is". We are not liable for data loss, business losses, or damages arising from use of the software. Always maintain backups of your pharmacy data.</p>
        <h2>5. Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of India.</p>
        <h2>6. Contact</h2>
        <p>Questions? Email <a href="mailto:support@shelfcure.com">support@shelfcure.com</a></p>
      </div>
    </div>
  );
}
