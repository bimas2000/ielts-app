"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, Headphones, PenLine, Mic,
  Brain, ClipboardList, BarChart3, Target, CalendarDays, Menu, X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/study-plan", label: "Study Plan", icon: CalendarDays, group: "main" },
  { href: "/progress", label: "Progress", icon: BarChart3, group: "main" },
  { href: "/reading", label: "Reading", icon: BookOpen, group: "practice" },
  { href: "/listening", label: "Listening", icon: Headphones, group: "practice" },
  { href: "/writing", label: "Writing", icon: PenLine, group: "practice" },
  { href: "/speaking", label: "Speaking", icon: Mic, group: "practice" },
  { href: "/vocabulary", label: "Vocabulary", icon: Brain, group: "practice" },
  { href: "/mock-test", label: "Mock Test", icon: ClipboardList, group: "practice" },
];

function NavLink({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {item.label}
      {item.href === "/study-plan" && !active && (
        <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Plan</span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sidebar]") && !target.closest("[data-sidebar-toggle]")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const navContent = (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">IELTS Pro</p>
            <p className="text-xs text-gray-500">Personal Prep</p>
          </div>
        </div>
        <button className="md:hidden p-1" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.filter((i) => i.group === "main").map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} onClick={() => setMobileOpen(false)} />
        ))}
        <div className="pt-3 pb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Practice</p>
        </div>
        {navItems.filter((i) => i.group === "practice").map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">IELTS Pro v1.0</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center px-4 h-14">
        <button data-sidebar-toggle onClick={() => setMobileOpen(!mobileOpen)} className="p-2 -ml-2 text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">IELTS Pro</span>
        </div>
        {/* Current page indicator */}
        <span className="ml-auto text-xs text-gray-400">
          {navItems.find((i) => i.href === pathname)?.label ?? ""}
        </span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        data-sidebar
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white flex flex-col shadow-xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col h-full shrink-0">
        {navContent}
      </aside>
    </>
  );
}
