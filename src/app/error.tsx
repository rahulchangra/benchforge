"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 text-red-400">
        <AlertCircle size={32} />
      </div>
      <h1 className="mt-6 text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-sm text-neutral-400">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-neutral-600">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        <RotateCcw size={14} />
        Try again
      </button>
    </div>
  );
}
