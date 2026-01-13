import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { BatchIngestRequestSchema } from "@error-ingestor/shared";
import { clickhouseClient } from "../clickhouse/client";

const ingestRouter = new Hono();

/**
 * POST /api/v1/ingest
 * Batch ingest error events directly to ClickHouse
 */
ingestRouter.post(
  "/ingest",
  zValidator("json", BatchIngestRequestSchema),
  async (c) => {
    const { events } = c.req.valid("json");
    const appId = c.get("appId");

    // Validate all events belong to the authenticated app
    const validEvents = events.filter((e) => e.appId === appId);

    if (validEvents.length !== events.length) {
      return c.json(
        {
          success: false,
          error: `Some events do not match authenticated app. Expected appId: ${appId}`,
        },
        400
      );
    }

    // Insert directly to ClickHouse
    const result = await clickhouseClient.insertEvents(validEvents);

    if (result.isErr()) {
      return c.json(
        {
          success: false,
          error: result.error.message,
        },
        500
      );
    }

    return c.json({
      success: true,
      accepted: validEvents.length,
    });
  }
);

/**
 * GET /api/v1/ingest/test
 * Test API key validity
 */
ingestRouter.get("/ingest/test", (c) => {
  const appId = c.get("appId");
  const appName = c.get("appName");

  return c.json({
    success: true,
    appId,
    appName,
  });
});

export { ingestRouter };
