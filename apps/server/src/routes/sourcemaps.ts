import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { clickhouseClient } from "../clickhouse/client";
import { sourceMapService } from "../services/sourceMapService";

const sourcemapsRouter = new Hono<{
  Variables: { appId: string };
}>();

/**
 * Upload source map schema.
 * Source maps are uploaded per-file per-version.
 */
const UploadSourceMapSchema = z.object({
  appVersion: z.string().min(1, "appVersion is required"),
  fileName: z.string().min(1, "fileName is required"),
  sourceMap: z.string().min(1, "sourceMap is required"),
});

/**
 * POST /api/v1/sourcemaps/upload
 * Upload a source map for a specific app version and bundle file.
 */
sourcemapsRouter.post(
  "/upload",
  zValidator("json", UploadSourceMapSchema),
  async (c) => {
    const appId = c.get("appId");
    const { appVersion, fileName, sourceMap } = c.req.valid("json");

    // Validate that sourceMap is valid JSON
    try {
      JSON.parse(sourceMap);
    } catch {
      return c.json(
        { success: false, error: "Invalid source map JSON format" },
        400
      );
    }

    const result = await clickhouseClient.insertSourceMap({
      appId,
      appVersion,
      fileName,
      sourceMap,
    });

    if (result.isErr()) {
      return c.json(
        { success: false, error: result.error.message },
        500
      );
    }

    // Clear cache for this app/version to pick up new source map
    sourceMapService.clearCache(appId, appVersion);

    return c.json({
      success: true,
      message: `Source map uploaded for ${fileName} (v${appVersion})`,
    });
  }
);

/**
 * Batch upload schema for uploading multiple source maps at once.
 */
const BatchUploadSchema = z.object({
  appVersion: z.string().min(1),
  sourceMaps: z.array(
    z.object({
      fileName: z.string().min(1),
      sourceMap: z.string().min(1),
    })
  ).min(1).max(20),
});

/**
 * POST /api/v1/sourcemaps/upload-batch
 * Upload multiple source maps in a single request.
 */
sourcemapsRouter.post(
  "/upload-batch",
  zValidator("json", BatchUploadSchema),
  async (c) => {
    const appId = c.get("appId");
    const { appVersion, sourceMaps } = c.req.valid("json");

    // Validate all source maps are valid JSON
    for (const sm of sourceMaps) {
      try {
        JSON.parse(sm.sourceMap);
      } catch {
        return c.json(
          { success: false, error: `Invalid source map JSON for ${sm.fileName}` },
          400
        );
      }
    }

    // Insert all source maps
    const results = await Promise.all(
      sourceMaps.map((sm) =>
        clickhouseClient.insertSourceMap({
          appId,
          appVersion,
          fileName: sm.fileName,
          sourceMap: sm.sourceMap,
        })
      )
    );

    const errors = results.filter((r) => r.isErr());
    if (errors.length > 0) {
      return c.json(
        {
          success: false,
          error: `Failed to upload ${errors.length} source maps`,
          uploaded: results.length - errors.length,
        },
        500
      );
    }

    // Clear cache for this app/version
    sourceMapService.clearCache(appId, appVersion);

    return c.json({
      success: true,
      uploaded: sourceMaps.length,
      message: `Uploaded ${sourceMaps.length} source maps for v${appVersion}`,
    });
  }
);

/**
 * GET /api/v1/sourcemaps/list
 * List all source maps for an app, optionally filtered by version.
 */
sourcemapsRouter.get("/list", async (c) => {
  const appId = c.get("appId");
  const appVersion = c.req.query("appVersion");

  const sourceMaps = await clickhouseClient.listSourceMaps(appId, appVersion);

  return c.json({
    success: true,
    sourceMaps,
  });
});

/**
 * DELETE /api/v1/sourcemaps/:appVersion
 * Delete all source maps for a specific app version.
 */
sourcemapsRouter.delete("/:appVersion", async (c) => {
  const appId = c.get("appId");
  const appVersion = c.req.param("appVersion");

  await clickhouseClient.deleteSourceMaps(appId, appVersion);

  // Clear cache
  sourceMapService.clearCache(appId, appVersion);

  return c.json({
    success: true,
    message: `Deleted source maps for v${appVersion}`,
  });
});

export { sourcemapsRouter };
