"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  PenLine,
  Users,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";

/*
============================================================
One sidebar for every dashboard.

The site navbar is hidden inside the dashboards, so this
sidebar also carries the logo, the account and the link
back to the public magazine.
============================================================
*/

const PANELS = {
  admin: {
    name: "Administration",
    role: "Administrator",
    menuItems: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "Activities",
        href: "/admin/activity",
        icon: CalendarDays,
      },
      {
        label: "Magazine",
        href: "/admin/magazine",
        icon: Newspaper,
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
    ],
  },

  hod: {
    name: "HOD Panel",
    role: "Head of Department",
    menuItems: [
      {
        label: "Department Magazine",
        href: "/hod",
        icon: LayoutDashboard,
      },
      {
        label: "Pending Requests",
        href: "/hod/studentRequest",
        icon: Inbox,
      },
      {
        label: "New Submission",
        href: "/hod/newSubmission",
        icon: PenLine,
      },
    ],
  },

  staff: {
    name: "Faculty Panel",
    role: "Faculty",
    menuItems: [
      {
        label: "My Submissions",
        href: "/staff",
        icon: LayoutDashboard,
      },
      {
        label: "New Submission",
        href: "/staff/new",
        icon: PenLine,
      },
    ],
  },

  coordinator: {
    name: "Coordinator Panel",
    role: "Magazine Coordinator",
    menuItems: [
      {
        label: "Pending Requests",
        href: "/coordinator",
        icon: Inbox,
      },
      {
        label: "Institute Magazine",
        href: "/coordinator/magazine",
        icon: BookOpen,
      },
      {
        label: "New Submission",
        href: "/coordinator/new",
        icon: PenLine,
      },
    ],
  },
};

export default function PanelSidebar({ panel }) {
  const { name, role, menuItems } = PANELS[panel];

  const homeHref = menuItems[0].href;

  const pathname = usePathname();
  const { user } = useUser();

  const [mobileOpen, setMobileOpen] = useState(false);

  // The page behind the open menu should not scroll
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href) => {
    // The first item is the panel home, active only on its own page
    if (href === homeHref) {
      return pathname === href;
    }

    // Child pages keep the parent menu active
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMenu = () => setMobileOpen(false);

  const logo = (
    <Link
      href={homeHref}
      onClick={closeMenu}
      className="flex min-w-0 items-center gap-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
        <Newspaper size={21} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-base font-bold tracking-tight text-slate-900">
          KPT E-Magazine
        </p>

        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">
          {name}
        </p>
      </div>
    </Link>
  );

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between gap-3 border-b border-teal-100 bg-white/95 px-4 backdrop-blur lg:hidden">
        {logo}

        <button
          type="button"
          onClick={() => setMobileOpen((previous) => !previous)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeMenu}
      />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-50 flex w-[270px] max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:top-0 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full"
        }`}
      >
        {/* =================================================
            LOGO (desktop; the mobile top bar has its own)
        ================================================= */}

        <div className="hidden h-20 shrink-0 items-center border-b border-slate-100 px-5 lg:flex">
          {logo}
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-teal-50 font-semibold text-teal-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      active
                        ? "bg-teal-700 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <span className="flex-1">{item.label}</span>

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

          <p className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Website
          </p>

          <Link
            href="/"
            onClick={closeMenu}
            className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-teal-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-teal-100 group-hover:text-teal-700">
              <BookOpen size={17} strokeWidth={2} />
            </span>

            <span className="flex-1">View Magazine</span>

            <ExternalLink
              size={14}
              className="text-slate-300 group-hover:text-teal-600"
            />
          </Link>
        </nav>

        {/* =================================================
            ACCOUNT
        ================================================= */}

        <div className="shrink-0 border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.fullName || role}
              </p>

              <p className="truncate text-xs text-slate-500">
                {role}
              </p>
            </div>
          </div>

          <SignOutButton>
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
