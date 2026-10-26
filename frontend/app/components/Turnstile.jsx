"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

const loadScript = () => {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  return scriptPromise;
};

export const turnstileConfigured = Boolean(SITE_KEY);

/*
============================================================
Cloudflare Turnstile: an "are you human" check that most
people never notice. Calls onToken with the token, or ""
when it expires.

Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
============================================================
*/

export default function Turnstile({ onToken, resetKey }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return;

    let widgetId = null;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          size: "flexible",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch((error) =>
        console.error("Turnstile could not load:", error)
      );

    return () => {
      cancelled = true;

      if (widgetId !== null && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
    // resetKey: a new check after each posted comment
  }, [resetKey]);

  if (!SITE_KEY) {
    return null;
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
}
