"use client";

import { useEffect } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuthCheckPage() {
  const router = useRouter();

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) {
      return;
    }

    const verifyUser = async () => {
      try {
        console.log("========================================");
        console.log("AUTH CHECK STARTED");
        console.log("========================================");

        console.log("Clerk loaded:", isLoaded);
        console.log("User loaded:", isUserLoaded);
        console.log("Signed in:", isSignedIn);
        console.log("Clerk user:", user?.id);
        console.log("API URL:", API_URL);

        // -------------------------------------------------
        // NOT SIGNED IN
        // -------------------------------------------------

        if (!isSignedIn || !user) {
          console.log("User is not signed in.");
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // GET CLERK TOKEN
        // -------------------------------------------------

        const token = await getToken();

        console.log(
          "Clerk token received:",
          token ? "YES" : "NO"
        );

        if (!token) {
          console.error(
            "Unable to obtain Clerk authentication token."
          );

          await signOut();
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // AXIOS CONFIG
        // -------------------------------------------------

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        console.log(
          "Authorization header prepared:",
          config.headers.Authorization
            ? "YES"
            : "NO"
        );

        // -------------------------------------------------
        // GET EXISTING USER
        // -------------------------------------------------

        let response;

        try {
          response = await axios.get(
            `${API_URL}/api/users/me`,
            config
          );

          console.log(
            "GET /api/users/me status:",
            response.status
          );

          console.log(
            "GET /api/users/me response:",
            response.data
          );
        } catch (error) {
          console.log(
            "GET /api/users/me failed:",
            error.response?.status
          );

          console.log(
            "GET /api/users/me response:",
            error.response?.data
          );

          // -------------------------------------------------
          // USER DOES NOT EXIST
          // CREATE USER
          // -------------------------------------------------

          if (error.response?.status === 404) {
            console.log(
              "User not found. Creating MongoDB user..."
            );

            try {
              response = await axios.post(
                `${API_URL}/api/users/me`,
                {
                  name:
                    user.fullName ||
                    user.firstName ||
                    "KPT User",

                  email:
                    user.primaryEmailAddress?.emailAddress ||
                    "",

                  phone:
                    user.primaryPhoneNumber?.phoneNumber ||
                    "",
                },
                config
              );

              console.log(
                "POST /api/users/me status:",
                response.status
              );

              console.log(
                "User created:",
                response.data
              );
            } catch (createError) {
              // -------------------------------------------------
              // POSSIBLE RACE CONDITION
              // -------------------------------------------------

              if (
                createError.response?.status === 409
              ) {
                console.log(
                  "User already exists. Fetching again..."
                );

                response = await axios.get(
                  `${API_URL}/api/users/me`,
                  config
                );
              } else {
                throw createError;
              }
            }
          } else {
            throw error;
          }
        }

        // -------------------------------------------------
        // GET USER DATA
        // -------------------------------------------------

        const userData =
          response?.data?.data ||
          response?.data?.user ||
          response?.data;

        console.log(
          "FINAL USER DATA:",
          userData
        );

        if (!userData) {
          console.error(
            "No user data received from backend."
          );

          await signOut();
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // ACTIVE CHECK
        // -------------------------------------------------

        if (userData.isActive === false) {
          console.log(
            "User account is inactive."
          );

          await signOut();
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        const role = userData.role;

        console.log(
          "USER ROLE:",
          role
        );

        // -------------------------------------------------
        // REDIRECT
        // -------------------------------------------------

        switch (role) {
          case "admin":
            console.log(
              "Redirecting to /admin"
            );

            router.replace("/admin");
            break;

          case "sports_officer":
            console.log(
              "Redirecting to /sports-officer"
            );

            router.replace("/sports-officer");
            break;

          case "college_coordinator":
            console.log(
              "Redirecting to /college"
            );

            router.replace("/college");
            break;

          case "student":
            console.log(
              "Redirecting to /student"
            );

            router.replace("/student");
            break;

          default:
            console.error(
              "Invalid or missing user role:",
              role
            );

            await signOut();
            router.replace("/");
        }
      } catch (error) {
        console.error(
          "Authentication verification failed:",
          error
        );

        console.error(
          "Status:",
          error.response?.status
        );

        console.error(
          "Response:",
          error.response?.data
        );

        // -------------------------------------------------
        // AUTHENTICATION ERROR
        // -------------------------------------------------

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          console.error(
            "Backend rejected Clerk authentication."
          );

          await signOut();
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // OTHER ERROR
        // -------------------------------------------------

        router.replace("/");
      }
    };

    verifyUser();
  }, [
    isLoaded,
    isSignedIn,
    isUserLoaded,
    user,
    getToken,
    router,
    signOut,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-teal-100 bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700" />
        </div>

        <h1 className="mt-5 text-xl font-black text-slate-900">
          Verifying account
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Please wait while the account and dashboard
          access are being verified.
        </p>

      </div>
    </main>
  );
}