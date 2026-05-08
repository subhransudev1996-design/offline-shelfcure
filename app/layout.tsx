import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShelfCure — Complete Pharmacy Management Software",
  description:
    "The complete GST-ready pharmacy management software for Indian pharmacies. POS billing, inventory, purchase management, GSTR1 export, and more. Lifetime license at ₹9,440.",
  keywords:
    "pharmacy software, medical shop software, GST billing software, pharmacy management, medicine inventory, GSTR1, India",
  openGraph: {
    title: "ShelfCure — Complete Pharmacy Management Software",
    description:
      "GST-ready pharmacy software with POS, inventory, and reports. One-time payment. Lifetime license.",
    type: "website",
    url: "https://desktop.shelfcure.com",
    siteName: "ShelfCure",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShelfCure — Pharmacy Management Software",
    description: "Complete pharmacy software. One-time payment. Lifetime license.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
