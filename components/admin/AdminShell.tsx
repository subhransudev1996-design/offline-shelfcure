"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Key,
  Clock,
  Upload,
  Users,
  UserPlus,
  Briefcase,
  Footprints,
  Map,
  BarChart3,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",  href: "/admin",           icon: LayoutDashboard },
  { label: "Leads",      href: "/admin/leads",      icon: UserPlus },
  { label: "Sales Team", href: "/admin/sales/employees", icon: Briefcase },
  { label: "Visits",     href: "/admin/sales/visits",    icon: Footprints },
  { label: "Sales Map",  href: "/admin/sales/map",       icon: Map },
  { label: "Reports",    href: "/admin/sales/reports",   icon: BarChart3 },
  { label: "Orders",     href: "/admin/orders",     icon: ShoppingBag },
  { label: "Licenses",   href: "/admin/licenses",   icon: Key },
  { label: "Trials",     href: "/admin/trials",     icon: Clock },
  { label: "Versions",   href: "/admin/versions",   icon: Upload },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
  { label: "Expenses",   href: "/admin/expenses",   icon: Wallet },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full bg-brand-navy", mobile ? "w-64" : "w-60")}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Image src="/logo.png" alt="ShelfCure" width={120} height={33} className="h-8 w-auto brightness-200" />
        <span className="mt-1.5 block text-white/40 text-[10px] font-semibold uppercase tracking-widest">
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={17} className={active ? "text-brand-cyan" : ""} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-white/40" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center gap-3 sticky top-0 z-30">
          <button
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900">
              {navItems.find((n) => pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href)))?.label || "Admin"}
            </h2>
          </div>
          <Link
            href="/"
            target="_blank"
            className="text-xs text-slate-400 hover:text-brand-navy transition-colors"
          >
            View site →
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
