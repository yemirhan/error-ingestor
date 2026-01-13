import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { clickhouseClient } from "../clickhouse/client";

const dashboardRouter = new Hono();

const ErrorsQuerySchema = z.object({
  appId: z.string().min(1),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  code: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const TrendsQuerySchema = z.object({
  appId: z.string().min(1),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  granularity: z.enum(["hour", "day"]).default("hour"),
});

/**
 * GET /dashboard/api/errors
 * List errors with filters
 */
dashboardRouter.get(
  "/errors",
  zValidator("query", ErrorsQuerySchema),
  async (c) => {
    const params = c.req.valid("query");

    // Default time range: last 24 hours
    const endTime = params.endTime ?? new Date().toISOString();
    const startTime =
      params.startTime ??
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      const errors = await clickhouseClient.queryErrors({
        appId: params.appId,
        startTime,
        endTime,
        code: params.code,
        userId: params.userId,
        limit: params.limit,
        offset: params.offset,
      });

      return c.json({
        success: true,
        errors,
        pagination: {
          limit: params.limit,
          offset: params.offset,
          hasMore: errors.length === params.limit,
        },
      });
    } catch (error) {
      console.error("[Dashboard] Query errors failed:", error);
      return c.json(
        {
          success: false,
          error: "Failed to query errors",
        },
        500
      );
    }
  }
);

/**
 * GET /dashboard/api/errors/:id
 * Get single error details
 */
dashboardRouter.get("/errors/:id", async (c) => {
  const id = c.req.param("id");
  const appId = c.req.query("appId");

  if (!appId) {
    return c.json({ success: false, error: "appId is required" }, 400);
  }

  try {
    const errors = await clickhouseClient.queryErrors({
      appId,
      startTime: "1970-01-01T00:00:00Z",
      endTime: new Date().toISOString(),
      limit: 1,
      offset: 0,
    });

    const error = errors.find((e) => e.id === id);

    if (!error) {
      return c.json({ success: false, error: "Error not found" }, 404);
    }

    return c.json({ success: true, error });
  } catch (error) {
    console.error("[Dashboard] Get error failed:", error);
    return c.json({ success: false, error: "Failed to get error" }, 500);
  }
});

/**
 * GET /dashboard/api/trends
 * Get error trends/aggregations
 */
dashboardRouter.get(
  "/trends",
  zValidator("query", TrendsQuerySchema),
  async (c) => {
    const params = c.req.valid("query");

    // Default time range: last 7 days
    const endTime = params.endTime ?? new Date().toISOString();
    const startTime =
      params.startTime ??
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const trends = await clickhouseClient.getErrorTrends({
        appId: params.appId,
        startTime,
        endTime,
        granularity: params.granularity,
      });

      return c.json({ success: true, trends });
    } catch (error) {
      console.error("[Dashboard] Get trends failed:", error);
      return c.json({ success: false, error: "Failed to get trends" }, 500);
    }
  }
);

/**
 * GET /dashboard/api/codes
 * Get all error codes for an app
 */
dashboardRouter.get("/codes", async (c) => {
  const appId = c.req.query("appId");

  if (!appId) {
    return c.json({ success: false, error: "appId is required" }, 400);
  }

  try {
    const codes = await clickhouseClient.getErrorCodes(appId);
    return c.json({ success: true, codes });
  } catch (error) {
    console.error("[Dashboard] Get codes failed:", error);
    return c.json({ success: false, error: "Failed to get codes" }, 500);
  }
});

/**
 * GET /dashboard/api/apps
 * List all registered apps (for demo, returns test app)
 */
dashboardRouter.get("/apps", (c) => {
  // In production, this would query the apps table
  return c.json({
    success: true,
    apps: [
      {
        id: "test-app",
        name: "Test Application",
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

export { dashboardRouter };
