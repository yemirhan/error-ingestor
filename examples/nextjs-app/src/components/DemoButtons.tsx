"use client";

import { useState } from "react";
import { ErrorIngestor, AppError, ErrorCodes } from "@error-ingestor/client";
import { AppErrors, AppErrorCodes } from "@/lib/errors";

export function DemoButtons() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showResult = (message: string) => {
    setResult(message);
    setTimeout(() => setResult(null), 3000);
  };

  // Demo 1: Manual capture
  const handleManualCapture = () => {
    const error = new AppError(
      AppErrorCodes.FORM_VALIDATION,
      "Email address is invalid"
    );

    ErrorIngestor.capture(error, {
      metadata: {
        field: "email",
        page: "/",
      },
      tags: {
        component: "DemoButtons",
      },
    });

    showResult("Error captured!");
  };

  // Demo 2: API call with error
  const handleApiError = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/demo?error=true");
      const data = await response.json();

      if (!response.ok) {
        const error = AppErrors.apiError("/api/demo", response.status);
        ErrorIngestor.capture(error, {
          metadata: { response: data },
        });
        showResult(`API Error: ${data.error}`);
      } else {
        showResult(`Success: ${data.message}`);
      }
    } catch (e) {
      const error = new AppError(ErrorCodes.NETWORK_ERROR, "Network failed");
      ErrorIngestor.capture(error);
      showResult("Network error");
    }

    setLoading(false);
  };

  // Demo 3: Successful API call
  const handleApiSuccess = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/demo");
      const data = await response.json();
      showResult(`Success: ${data.message}`);
    } catch (e) {
      showResult("Network error");
    }

    setLoading(false);
  };

  // Demo 4: Throw unhandled error (caught by error.tsx)
  const handleThrowError = () => {
    throw new Error("Intentional error for demo purposes");
  };

  // Demo 5: Check queue
  const handleCheckQueue = () => {
    const size = ErrorIngestor.getQueueSize();
    showResult(`Queue size: ${size}`);
  };

  // Demo 6: Flush queue
  const handleFlush = async () => {
    setLoading(true);
    await ErrorIngestor.flush();
    showResult("Queue flushed!");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {result && (
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-center">
          {result}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-500">Loading...</div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">
          Manual Capture
        </h3>
        <button
          onClick={handleManualCapture}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          Capture Custom Error
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">
          API Errors
        </h3>
        <button
          onClick={handleApiError}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          Call API (Error Response)
        </button>
        <button
          onClick={handleApiSuccess}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          Call API (Success)
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">
          Error Boundary
        </h3>
        <button
          onClick={handleThrowError}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          Throw Unhandled Error
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">
          Queue Management
        </h3>
        <button
          onClick={handleCheckQueue}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          Check Queue Size
        </button>
        <button
          onClick={handleFlush}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition"
        >
          Force Flush
        </button>
      </div>
    </div>
  );
}
