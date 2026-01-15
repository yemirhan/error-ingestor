/** Generate a UUID v4 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers/Node 19+)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Get platform information */
export function getPlatformInfo(): {
  platform: "ios" | "android" | "web";
  platformVersion: string;
} {
  // Detect platform without importing react-native (avoids Metro static analysis issues)

  // Check navigator.product for React Native
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    // We're in React Native - detect iOS vs Android from userAgent or other hints
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

    if (userAgent.includes("Android") || /android/i.test(userAgent)) {
      return {
        platform: "android",
        platformVersion: userAgent,
      };
    }

    // Default to iOS for React Native (most common, and iOS doesn't always have clear userAgent)
    return {
      platform: "ios",
      platformVersion: userAgent || "unknown",
    };
  }

  // Check for web browser
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    return {
      platform: "web",
      platformVersion: navigator.userAgent,
    };
  }

  return {
    platform: "web",
    platformVersion: "unknown",
  };
}

/** Simple logger that respects debug mode */
export function createLogger(debug: boolean) {
  return {
    log: (...args: unknown[]) => {
      if (debug) {
        console.log("[ErrorIngestor]", ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (debug) {
        console.warn("[ErrorIngestor]", ...args);
      }
    },
    error: (...args: unknown[]) => {
      // Always log errors
      console.error("[ErrorIngestor]", ...args);
    },
  };
}
