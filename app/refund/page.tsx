import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Refund Policy — ShelfCure" };

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="ShelfCure" width={120} height={33} className="h-8 w-auto" /></Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-brand-navy">← Back to Home</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
        <h1>Refund Policy</h1>
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        <h2>Our Policy</h2>
        <p>ShelfCure is digital software delivered immediately upon payment. Because the license key and download link are issued instantly, we generally do not offer refunds once a license has been issued.</p>
        <h2>Exceptions</h2>
        <p>We will consider a refund in the following cases:</p>
        <ul>
          <li>The software cannot be installed or activated despite our support team's assistance</li>
          <li>The software was purchased in error and the license has not been activated</li>
          <li>Duplicate payment was charged</li>
        </ul>
        <h2>How to Request</h2>
        <p>Email <a href="mailto:support@shelfcure.com">support@shelfcure.com</a> within 7 days of purchase with your order ID. We will review your request within 3 business days.</p>
        <h2>Trial Recommendation</h2>
        <p>We strongly recommend using our 7-day free trial before purchasing to ensure ShelfCure meets your pharmacy's needs.</p>
      </div>
    </div>
  );
}
