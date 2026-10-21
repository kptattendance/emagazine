import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// How long one answer is reused before asking the server again
const CACHE_MS = 60 * 1000;

let cached = null;

/*
============================================================
The logged-in user's profile (/api/users/me).

The navbar, the role check and the sidebar all need it on
every page. They share one request instead of each asking
the server separately on every navigation.

Returns the axios response, like axios.get would.
============================================================
*/

export function getCurrentUser(clerkUserId) {
  const now = Date.now();

  if (
    cached &&
    cached.clerkUserId === clerkUserId &&
    now - cached.at < CACHE_MS
  ) {
    return cached.promise;
  }

  const promise = axios.get(`${API_URL}/api/users/me`);

  cached = { clerkUserId, promise, at: now };

  // A failed answer is never reused
  promise.catch(() => {
    if (cached?.promise === promise) {
      cached = null;
    }
  });

  return promise;
}
