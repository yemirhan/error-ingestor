import { Hono } from "hono";
import { clickhouseClient } from "../clickhouse/client";

const healthRouter = new Hono();

/**
 * GET /health
 * Health check endpoint
 */
healthRouter.get("/", async (c) => {
  const clickhouseHealthy = await clickhouseClient.ping();

  const status = clickhouseHealthy ? "healthy" : "degraded";
  const statusCode = clickhouseHealthy ? 200 : 503;

  return c.json(
    {
      status,
      timestamp: new Date().toISOString(),
      services: {
        clickhouse: clickhouseHealthy ? "up" : "down",
      },
    },
    statusCode
  );
});

/**
 * GET /health/live
 * Liveness probe - just checks if server is running
 */
healthRouter.get("/live", (c) => {
  return c.json({ status: "ok" });
});

/**
 * GET /health/ready
 * Readiness probe - checks if dependencies are ready
 */
healthRouter.get("/ready", async (c) => {
  const clickhouseHealthy = await clickhouseClient.ping();

  if (!clickhouseHealthy) {
    return c.json({ status: "not ready", reason: "clickhouse unavailable" }, 503);
  }

  return c.json({ status: "ready" });
});

export { healthRouter };
