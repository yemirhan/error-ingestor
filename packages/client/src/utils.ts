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
  // Check if React Native Platform is available
  try {
    // Dynamic import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require("react-native");
    return {
      platform: Platform.OS === "ios" ? "ios" : "android",
      platformVersion: String(Platform.Version),
    };
  } catch {
    // Fallback to web
    if (typeof navigator !== "undefined") {
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
