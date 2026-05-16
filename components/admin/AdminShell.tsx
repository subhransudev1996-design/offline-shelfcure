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
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavLeaf {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}
interface NavGroup {
  label: string;
  icon: typeof LayoutDashboard;
  children: NavLeaf[];
}
type NavEntry = NavLeaf | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "children" in e;

const navItems: NavEntry[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Sales & Leads",
    icon: Briefcase,
    children: [
      { label: "Leads",       href: "/admin/leads",           icon: UserPlus },
      { label: "Sales Team",  href: "/admin/sales/employees", icon: Briefcase },
      { label: "Visits",      href: "/admin/sales/visits",    icon: Footprints },
      { label: "Sales Map",   href: "/admin/sales/map",       icon: Map },
      { label: "Sales Report",href: "/admin/sales/reports",   icon: BarChart3 },
    ],
  },
  {
    label: "Licensing",
    icon: Key,
    children: [
      { label: "Licenses",  href: "/admin/licenses",  icon: Key },
      { label: "Trials",    href: "/admin/trials",    icon: Clock },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Operations",
    icon: ShoppingBag,
    children: [
      { label: "Orders",   href: "/admin/orders",   icon: ShoppingBag },
      { label: "Versions", href: "/admin/versions", icon: Upload },
      { label: "Expenses", href: "/admin/expenses", icon: Wallet },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "Pricing", href: "/admin/settings/pricing", icon: Wallet },
    ],
  },
];

function isLeafActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Which group contains the active route — used as the initial open group
  const activeGroup = navItems.find(
    (e) => isGroup(e) && e.children.some((c) => isLeafActive(pathname, c.href))
  )?.label ?? null;

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeGroup ? [activeGroup] : [])
  );

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

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
        {navItems.map((entry) => {
          // ── Standalone link ──
          if (!isGroup(entry)) {
            const active = isLeafActive(pathname, entry.href);
            const Icon = entry.icon;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={17} className={active ? "text-brand-cyan" : ""} />
                {entry.label}
                {active && <ChevronRight size={14} className="ml-auto text-white/40" />}
              </Link>
            );
          }

          // ── Group with submenu ──
          const Icon = entry.icon;
          const open = openGroups.has(entry.label);
          const groupActive = entry.children.some((c) => isLeafActive(pathname, c.href));
          return (
            <div key={entry.label}>
              <button
                onClick={() => toggleGroup(entry.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  groupActive && !open ? "text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={17} className={groupActive ? "text-brand-cyan" : ""} />
                {entry.label}
                <ChevronDown
                  size={14}
                  className={cn("ml-auto text-white/40 transition-transform", open && "rotate-180")}
                />
              </button>
              {open && (
                <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                  {entry.children.map((child) => {
                    const active = isLeafActive(pathname, child.href);
                    const CIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                          active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <CIcon size={15} className={active ? "text-brand-cyan" : ""} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
              {(() => {
                for (const entry of navItems) {
                  if (!isGroup(entry)) {
                    if (isLeafActive(pathname, entry.href)) return entry.label;
                  } else {
                    const child = entry.children.find((c) => isLeafActive(pathname, c.href));
                    if (child) return `${entry.label} · ${child.label}`;
                  }
                }
                return "Admin";
              })()}
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
