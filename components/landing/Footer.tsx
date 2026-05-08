import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Image
              src="/logo.png"
              alt="ShelfCure"
              width={140}
              height={38}
              className="h-9 w-auto brightness-200 mb-4"
            />
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Complete pharmacy management software built for Indian pharmacies.
              GST-ready, offline-first, one-time payment.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="bg-white/5 border border-white/10 text-xs px-3 py-1 rounded-full">
                ✓ GST-Compliant
              </span>
              <span className="bg-white/5 border border-white/10 text-xs px-3 py-1 rounded-full">
                ✓ Made in India 🇮🇳
              </span>
              <span className="bg-white/5 border border-white/10 text-xs px-3 py-1 rounded-full">
                ✓ Lifetime License
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#demo" className="hover:text-white transition-colors">Demo Video</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/trial" className="hover:text-white transition-colors">Free Trial</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Buy Now</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Support & Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#support" className="hover:text-white transition-colors">Contact Support</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {year} ShelfCure. All rights reserved.</p>
          <p>Made with ❤️ for Indian Pharmacies</p>
          <p>
            Payments secured by{" "}
            <span className="text-slate-300 font-medium">Razorpay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
