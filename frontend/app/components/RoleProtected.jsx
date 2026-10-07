"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ROLE_HOME = {
  admin: "/admin",
  hod: "/hod",
  principal: "/principal",
  staff: "/staff",
  mag_coordinator: "/magazine",
  student: "/student/magazine",
};

export default function RoleProtected({
  allowedRoles = [],
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const { signOut } = useClerk();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) {
      return;
    }

    let cancelled = false;

    const verifyAccess = async () => {
      try {
        if (!isSignedIn || !user) {
          router.replace("/");
          return;
        }

        const token = await getToken();

        if (!token) {
          await signOut();
          router.replace("/");
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

        const userData =
          response?.data?.data ||
          response?.data?.user ||
          response?.data;

        if (!userData) {
          await signOut();
          router.replace("/");
          return;
        }

        if (userData.isActive === false) {
          await signOut();
          router.replace("/");
          return;
        }

        const role = String(userData.role || "")
          .trim()
          .toLowerCase();

        if (!role) {
          await signOut();
          router.replace("/");
          return;
        }

        const normalizedAllowedRoles =
          allowedRoles.map((item) =>
            String(item).trim().toLowerCase()
          );

        const isAllowed =
          normalizedAllowedRoles.includes(role);

        if (!isAllowed) {
          const correctHome =
            ROLE_HOME[role];

          if (correctHome) {
            router.replace(correctHome);
          } else {
            await signOut();
            router.replace("/");
          }

          return;
        }

        if (!cancelled) {
          setChecking(false);
        }
      } catch (error) {
        console.error(
          "ROLE PROTECTION ERROR:",
          error
        );

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          await signOut();
          router.replace("/");
          return;
        }

        router.replace("/");
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    isUserLoaded,
    user,
    getToken,
    router,
    signOut,
    pathname,
    allowedRoles,
  ]);

  if (
    !isLoaded ||
    !isUserLoaded ||
    checking
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-700" />
          </div>

          <h1 className="mt-5 text-xl font-black text-slate-900">
            Checking access
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Verifying account permissions...
          </p>
        </div>
      </main>
    );
  }

  return children;
}