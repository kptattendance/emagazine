/*
=====================================================
CLOUDFLARE TURNSTILE
=====================================================

Checks the token the invisible "are you human" widget
gave the reader's browser.

Until TURNSTILE_SECRET_KEY is set the check is skipped,
so comments keep working while it is being set up.
=====================================================
*/

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const turnstileEnabled = () =>
  Boolean(process.env.TURNSTILE_SECRET_KEY);

export const verifyTurnstile = async (token, ip) => {
  if (!turnstileEnabled()) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: String(token),
        ...(ip && { remoteip: ip }),
      }),
    });

    const result = await response.json();

    return Boolean(result.success);
  } catch (error) {
    console.error("TURNSTILE CHECK ERROR:", error);

    return false;
  }
};
