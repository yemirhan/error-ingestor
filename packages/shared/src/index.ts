// Errors
export {
  ErrorCodes,
  AppError,
  Errors,
  isAppError,
  getErrorInfo,
  type ErrorCode,
} from "./errors";

// Schemas
export {
  PlatformSchema,
  ErrorEventSchema,
  BatchIngestRequestSchema,
  BatchIngestResponseSchema,
  ErrorQuerySchema,
  ErrorTrendQuerySchema,
  ErrorTrendPointSchema,
  type Platform,
  type ErrorEvent,
  type BatchIngestRequest,
  type BatchIngestResponse,
  type ErrorQuery,
  type ErrorTrendQuery,
  type ErrorTrendPoint,
} from "./schemas";

// Types
export type {
  ErrorIngestorConfig,
  CaptureOptions,
  DeviceInfo,
  App,
  ErrorFilters,
} from "./types";
