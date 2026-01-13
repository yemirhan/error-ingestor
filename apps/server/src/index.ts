import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { ingestRouter } from "./routes/ingest";
import { healthRouter } from "./routes/health";
import { dashboardRouter } from "./routes/dashboard";
import { authMiddleware } from "./middleware/auth";
import { config } from "./config";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-API-Key", "Authorization"],
  })
);

// Public routes
app.route("/health", healthRouter);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "Error Ingestor API",
    version: "0.1.0",
    endpoints: {
      health: "/health",
      ingest: "/api/v1/ingest",
      dashboard: "/dashboard/api",
    },
  });
});

// Protected API routes (API key auth)
app.use("/api/*", authMiddleware);
app.route("/api/v1", ingestRouter);

// Dashboard routes (no auth for demo, add session auth in production)
app.route("/dashboard/api", dashboardRouter);

// Error handler
app.onError((err, c) => {
  console.error("[Error]", err);
  return c.json(
    {
      success: false,
      error: err.message,
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not found",
    },
    404
  );
});

// Startup
console.log(`Starting Error Ingestor Server...`);
console.log(`Server running on http://localhost:${config.port}`);
console.log(`Test API key: ei_test_key_12345`);

export default {
  port: config.port,
  fetch: app.fetch,
};
