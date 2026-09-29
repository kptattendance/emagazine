"use client";

import Link from "next/link";
import axios from "axios";

import {
  SignInButton,
  Show,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";

import {
  Home,
  LayoutDashboard,
  Menu,
  Newspaper,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("/auth/check");

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // ============================================================
  // DETERMINE DASHBOARD
  // ============================================================

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    const determineDashboard = async () => {
      try {
        console.log(
          "Navbar: determining dashboard..."
        );

        const token = await getToken();

        console.log(
          "Navbar Clerk token:",
          token ? "YES" : "NO"
        );

        if (!token) {
          console.error(
            "Navbar: Clerk token unavailable."
          );

          return;
        }

        const response = await axios.get(
          `${API_URL}/api/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "Navbar user response:",
          response.data
        );

        const userData =
          response.data?.data ||
          response.data?.user ||
          response.data;

        const role = userData?.role;

        console.log(
          "Navbar detected role:",
          role
        );

        switch (role) {
          case "admin":
            setDashboardUrl("/admin");
            break;

          case "sports_officer":
            setDashboardUrl("/sports-officer");
            break;

          case "college_coordinator":
            setDashboardUrl("/college");
            break;

          case "student":
            setDashboardUrl("/student");
            break;

          default:
            setDashboardUrl("/auth/check");
        }
      } catch (error) {
        console.error(
          "Failed to determine dashboard:",
          error
        );

        console.error(
          "Navbar status:",
          error.response?.status
        );

        console.error(
          "Navbar response:",
          error.response?.data
        );

        setDashboardUrl("/auth/check");
      }
    };

    determineDashboard();
  }, [
    isLoaded,
    isSignedIn,
    user,
    getToken,
  ]);

  return (
    <header className="sticky top-0 z-50 border-b border-teal-100 bg-white/95 backdrop-blur">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

        {/* ======================================================
            LOGO
        ====================================================== */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
            <Newspaper size={21} />
          </div>

          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">
              KPT E-Magazine
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">
              Karnataka Government Polytechnic
            </div>
          </div>
        </Link>

        {/* ======================================================
            DESKTOP NAVIGATION
        ====================================================== */}

        <nav className="hidden items-center gap-1 md:flex">

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
          >
            <Home size={16} />
            Home
          </Link>

          <Link
            href="/#latest"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
          >
            Latest Activities
          </Link>

          <Link
            href="/#departments"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
          >
            Departments
          </Link>

          <Link
            href="/#achievements"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
          >
            Achievements
          </Link>

          {/* ====================================================
              DASHBOARD
          ==================================================== */}

          <Show when="signed-in">
            <Link
              href={dashboardUrl}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </Show>

        </nav>

        {/* ======================================================
            DESKTOP LOGIN
        ====================================================== */}

        <div className="hidden items-center gap-3 md:flex">

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
              >
                Login
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>

        </div>

        {/* ======================================================
            MOBILE MENU BUTTON
        ====================================================== */}

        <button
          type="button"
          onClick={() =>
            setMobileMenu((value) => !value)
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenu ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>

      </div>

      {/* ========================================================
          MOBILE MENU
      ======================================================== */}

      {mobileMenu && (
        <div className="border-t border-teal-100 bg-white px-5 py-4 md:hidden">

          <div className="flex flex-col gap-1">

            <Link
              href="/"
              onClick={() =>
                setMobileMenu(false)
              }
              className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              <Home size={16} />
              Home
            </Link>

            <Link
              href="/#latest"
              onClick={() =>
                setMobileMenu(false)
              }
              className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              Latest Activities
            </Link>

            <Link
              href="/#departments"
              onClick={() =>
                setMobileMenu(false)
              }
              className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              Departments
            </Link>

            <Link
              href="/#achievements"
              onClick={() =>
                setMobileMenu(false)
              }
              className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              Achievements
            </Link>

            <Show when="signed-in">
              <Link
                href={dashboardUrl}
                onClick={() =>
                  setMobileMenu(false)
                }
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </Show>

            <div className="mt-3 border-t border-slate-100 pt-3">

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white"
                  >
                    Login
                  </button>
                </SignInButton>
              </Show>

              <Show when="signed-in">
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserButton />

                  <span className="text-sm font-semibold text-slate-700">
                    Account
                  </span>
                </div>
              </Show>

            </div>

          </div>

        </div>
      )}

    </header>
  );
}