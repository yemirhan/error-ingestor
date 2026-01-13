"use client";

import { useEffect } from "react";
import { ErrorIngestor } from "@error-ingestor/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error to Error Ingestor
    ErrorIngestor.capture(error, {
      tags: {
        source: "next-error-boundary",
        digest: error.digest || "unknown",
      },
    });
  }, [error]);

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
