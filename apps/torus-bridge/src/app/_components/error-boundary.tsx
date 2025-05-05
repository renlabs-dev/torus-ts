"use client";

import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useState } from "react";
import { logger } from "~/utils/logger";

type ErrorBoundaryProps = PropsWithChildren;

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback(
    (event: ErrorEvent | PromiseRejectionEvent) => {
      const err: unknown =
        event instanceof ErrorEvent ? event.error : event.reason;
      if (err instanceof Error) {
        setError(err);
        logger.error("ErrorBoundary caught error", {
          message: err.message,
          stack: err.stack,
          componentStack: err.stack ?? "Stack trace unavailable",
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, [handleError]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          type="button"
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
