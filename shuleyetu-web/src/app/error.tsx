'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-slate-950 px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full bg-red-500/10 p-4 text-red-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-100">Something went wrong!</h2>
        <p className="mt-2 text-slate-400">
          An unexpected error occurred. Our team has been notified and is working to fix it.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-slate-400">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
