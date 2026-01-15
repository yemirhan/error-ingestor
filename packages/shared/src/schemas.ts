import { z } from "zod";

/** Supported platforms */
export const PlatformSchema = z.enum(["ios", "android", "web"]);
export type Platform = z.infer<typeof PlatformSchema>;

/** Stack parser type */
export const StackParserSchema = z.enum(["browser", "react-native", "node", "unknown"]);

/** Single stack frame schema */
export const StackFrameSchema = z.object({
  functionName: z.string().nullable(),
  fileName: z.string().nullable(),
  lineNumber: z.number().int().nullable(),
  columnNumber: z.number().int().nullable(),
  inApp: z.boolean(),
  raw: z.string(),
  // Server-populated fields after source map resolution
  originalFileName: z.string().nullable().optional(),
  originalLineNumber: z.number().int().nullable().optional(),
  originalColumnNumber: z.number().int().nullable().optional(),
  originalFunctionName: z.string().nullable().optional(),
  resolved: z.boolean().optional(),
});

/** Parsed stack trace schema */
export const ParsedStackTraceSchema = z.object({
  frames: z.array(StackFrameSchema),
  raw: z.string(),
  parser: StackParserSchema,
});

/** Single error event schema */
export const ErrorEventSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  message: z.string(),
  stackTrace: z.string(),
  parsedStack: ParsedStackTraceSchema.optional(),
  appId: z.string().min(1),
  appVersion: z.string(),
  platform: PlatformSchema,
  platformVersion: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.record(z.string()).optional(),
});

export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/** Batch ingest request schema */
export const BatchIngestRequestSchema = z.object({
  events: z.array(ErrorEventSchema).min(1).max(100),
});

export type BatchIngestRequest = z.infer<typeof BatchIngestRequestSchema>;

/** Batch ingest response schema */
export const BatchIngestResponseSchema = z.object({
  success: z.boolean(),
  accepted: z.number().optional(),
  error: z.string().optional(),
});

export type BatchIngestResponse = z.infer<typeof BatchIngestResponseSchema>;

/** Error query parameters */
export const ErrorQuerySchema = z.object({
  appId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  code: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export type ErrorQuery = z.infer<typeof ErrorQuerySchema>;

/** Error trend query parameters */
export const ErrorTrendQuerySchema = z.object({
  appId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  granularity: z.enum(["hour", "day"]).default("hour"),
});

export type ErrorTrendQuery = z.infer<typeof ErrorTrendQuerySchema>;

/** Error trend data point */
export const ErrorTrendPointSchema = z.object({
  time: z.string(),
  count: z.number(),
  uniqueCodes: z.number(),
  affectedUsers: z.number(),
});

export type ErrorTrendPoint = z.infer<typeof ErrorTrendPointSchema>;
