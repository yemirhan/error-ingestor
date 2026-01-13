import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createHash } from "crypto";

// In-memory store for demo purposes
// In production, this should be in a database
const apiKeys = new Map<string, { appId: string; appName: string }>();

// Add a test API key for development
const TEST_API_KEY = "ei_test_key_12345";
apiKeys.set(hashApiKey(TEST_API_KEY), {
  appId: "test-app",
  appName: "Test Application",
});

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; hash: string } {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const key = `ei_${Buffer.from(randomBytes).toString("base64url")}`;
  const hash = hashApiKey(key);
  return { key, hash };
}

export function registerApp(
  appId: string,
  appName: string
): { apiKey: string } {
  const { key, hash } = generateApiKey();
  apiKeys.set(hash, { appId, appName });
  return { apiKey: key };
}

export function getAppByApiKey(
  apiKey: string
): { appId: string; appName: string } | null {
  const hash = hashApiKey(apiKey);
  return apiKeys.get(hash) ?? null;
}

// Type augmentation for Hono context
declare module "hono" {
  interface ContextVariableMap {
    appId: string;
    appName: string;
  }
}

/**
 * Middleware that validates the X-API-Key header
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    throw new HTTPException(401, { message: "API key required" });
  }

  const app = getAppByApiKey(apiKey);

  if (!app) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  // Store app info in context
  c.set("appId", app.appId);
  c.set("appName", app.appName);

  await next();
});
