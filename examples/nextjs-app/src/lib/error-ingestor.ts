"use client";

import { ErrorIngestor } from "@error-ingestor/client";

let initialized = false;

export function initErrorIngestor() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  ErrorIngestor.init({
    apiKey: process.env.NEXT_PUBLIC_ERROR_INGESTOR_API_KEY || "ei_test_key_12345",
    appId: "com.example.nextjs",
    appVersion: "1.0.0",
    endpoint: process.env.NEXT_PUBLIC_ERROR_INGESTOR_ENDPOINT || "http://localhost:3000",
    debug: process.env.NODE_ENV === "development",
    batchSize: 5,
    flushInterval: 10000,
  });

  initialized = true;
  console.log("[ErrorIngestor] Initialized");
}

export { ErrorIngestor };
