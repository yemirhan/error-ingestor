import { useEffect } from "react";
import { Stack } from "expo-router";
import { ErrorIngestor, ErrorBoundary } from "@error-ingestor/client";
import { ErrorFallback } from "../src/components/ErrorFallback";

// Initialize Error Ingestor
ErrorIngestor.init({
  apiKey: "ei_test_key_12345", // Use your actual API key
  appId: "com.example.erroringestor",
  appVersion: "1.0.0",
  endpoint: "http://localhost:3000", // Your Error Ingestor server
  debug: __DEV__, // Enable logging in development
  batchSize: 5,
  flushInterval: 10000,
});

export default function RootLayout() {
  useEffect(() => {
    // Example: Set user ID after login
    // ErrorIngestor.setUserId('user-123');

    return () => {
      // Cleanup on unmount
      ErrorIngestor.destroy();
    };
  }, []);

  return (
    <ErrorBoundary
      fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}
      onError={(error, errorInfo) => {
        console.log("Error caught by boundary:", error.message);
        console.log("Component stack:", errorInfo.componentStack);
      }}
    >
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#3b82f6" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Error Ingestor" }} />
      </Stack>
    </ErrorBoundary>
  );
}
