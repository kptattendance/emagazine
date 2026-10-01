"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Inbox,
  PenLine,
  BookOpen,
  Building2,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { useState } from "react";
import { SignOutButton, UserButton } from "@clerk/nextjs";

const menuItems = [
  {
    label: "Department Magazine",
    href: "/hod",
    icon: LayoutDashboard,
  },

  {
    label: "Students Requests",
    href: "/hod/studentRequest",
    icon: Inbox,
  },

  {
    label: "New Submission",
    href: "/hod/newSubmission",
    icon: PenLine,
  },

  // {
  //   label: "HOD Publications",
  //   href: "/hod/myPublications",
  //   icon: BookOpen,
  // },


];

export default function HODSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => {
    // Dashboard should only be active on /hod
    if (href === "/hod") {
      return pathname === "/hod";
    }

    // Exact page
    if (pathname === href) {
      return true;
    }

    // Child pages should keep the parent menu active
    // Example:
    // /hod/magazine/edit/123
    // will keep "Students Requests" active.
    return pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            KPT eMagazine
          </h1>

          <p className="text-xs text-slate-500">
            HOD Panel
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-amber-50 hover:text-amber-700"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </div>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              KPT eMagazine
            </h1>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />

              <p className="text-xs font-medium text-slate-500">
                HOD Panel
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="mt-5 flex-1 space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-amber-100 text-amber-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 2}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* =================================================
            BOTTOM USER SECTION
        ================================================= */}

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                HOD
              </p>

              <p className="text-xs text-slate-500">
                Department Head
              </p>
            </div>
          </div>

          <SignOutButton>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />

              <span>Logout</span>
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}