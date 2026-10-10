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
     

        // -------------------------------------------------
        // NOT SIGNED IN
        // -------------------------------------------------

        if (!isSignedIn || !user) {
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // GET CLERK TOKEN
        // -------------------------------------------------

        const token = await getToken();

       

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

       

        // -------------------------------------------------
        // GET EXISTING USER
        // -------------------------------------------------

        let response;

        try {
          response = await axios.get(
            `${API_URL}/api/users/me`,
            config
          );

    
        } catch (error) {
          


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

            
            } catch (createError) {
              // -------------------------------------------------
              // POSSIBLE RACE CONDITION
              // -------------------------------------------------

              if (createError.response?.status === 409) {
              

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
         

          await signOut();
          router.replace("/");
          return;
        }

        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        const role = String(userData.role || "")
          .trim()
          .toLowerCase();

       
        // -------------------------------------------------
        // REDIRECT
        // -------------------------------------------------

        switch (role) {
          case "admin":
          

            router.replace("/admin");
            return;

          case "hod":
          

            router.replace("/hod");
            return;

          case "principal":
         

            router.replace("/principal");
            return;

          case "staff":
          

            router.replace("/staff");
            return;

          case "mag_coordinator":
          

            router.replace("/coordinator");
            return;

          case "student":
           
            router.replace("/student/magazine");
            return;

          default:
            console.error(
              "Invalid or missing user role:",
              role
            );

            await signOut();
            router.replace("/");
            return;
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