"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mb-4 inline-flex rounded-full bg-red-500/10 p-4 text-red-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <p className="mt-2 text-slate-400">
              An unexpected error occurred. Our team has been notified and is working to fix it.
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-slate-500">Error ID: {error.digest}</p>
            )}
            <button
              onClick={() => reset()}
              className="mt-6 rounded-lg bg-sky-500 px-6 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
