"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Building2,
  Users,
  Image,
  Trophy,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { Show, UserButton, SignOutButton } from "@clerk/nextjs";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Activities",
    href: "/admin/activity",
    icon: CalendarDays,
  },
  {
    title: "Magazine",
    href: "/admin/magazine",
    icon: Newspaper,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link
          href="/admin"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Newspaper size={21} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              KPT eMagazine
            </p>
            <p className="text-[10px] font-medium text-slate-500">
              Administration
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ================= MOBILE OVERLAY ================= */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ================= LOGO ================= */}
        <div className="flex h-20 items-center border-b border-slate-100 px-5">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Newspaper size={23} />
            </div>

            <div>
              <h1 className="text-base font-bold text-slate-900">
                KPT eMagazine
              </h1>

              <p className="text-xs font-medium text-slate-500">
                Administration
              </p>
            </div>
          </Link>
        </div>

        {/* ================= COLLEGE LABEL ================= */}
        <div className="mx-4 mt-5 rounded-xl bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <GraduationCap
              size={18}
              className="text-amber-700"
            />

            <div>
              <p className="text-xs font-bold text-slate-800">
                KPT Mangaluru
              </p>

              <p className="text-[10px] text-slate-500">
                eMagazine Management
              </p>
            </div>
          </div>
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.3 : 1.9}
                    className={
                      active
                        ? "text-teal-700"
                        : "text-slate-400 group-hover:text-teal-600"
                    }
                  />

                  <span className="flex-1">
                    {item.title}
                  </span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="text-teal-600"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ================= USER ================= */}
        <div className="border-t border-slate-100 p-4">
          <Show when="signed-in">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <UserButton />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  Administrator
                </p>

                <p className="text-xs text-slate-500">
                  Magazine Admin
                </p>
              </div>
            </div>
          </Show>

          <Show when="signed-in">
            <SignOutButton>
              <button
                type="button"
                className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </SignOutButton>
          </Show>
        </div>
      </aside>
    </>
  );
}