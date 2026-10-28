"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Takes the reader from a shared link to the article itself
export default function ArticleRedirect({ id, title }) {
  const router = useRouter();

  const target = `/magazine?article=${encodeURIComponent(id)}`;

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-teal-100 border-t-teal-700" />

        <p className="mt-4 text-sm font-semibold text-slate-600">
          {title ? `Opening "${title}"...` : "Opening the article..."}
        </p>

        <Link
          href={target}
          className="mt-3 inline-block text-sm font-bold text-teal-700 underline"
        >
          Tap here if it does not open
        </Link>
      </div>
    </main>
  );
}
