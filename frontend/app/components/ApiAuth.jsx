"use client";

import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let getClerkToken = null;

/*
============================================================
Every request to the backend carries the Clerk token,
so the backend knows who is logged in.
============================================================
*/

axios.interceptors.request.use(async (config) => {
  const isApiRequest =
    Boolean(API_URL) &&
    String(config.url || "").startsWith(API_URL);

  if (!isApiRequest || config.headers?.Authorization) {
    return config;
  }

  try {
    const token = getClerkToken
      ? await getClerkToken()
      : await window.Clerk?.session?.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Unable to attach Clerk token:", error);
  }

  return config;
});

export default function ApiAuth() {
  const { getToken } = useAuth();

  useEffect(() => {
    getClerkToken = getToken;
  }, [getToken]);

  return null;
}
