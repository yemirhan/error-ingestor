// Main client
export { ErrorIngestor } from "./ErrorIngestor";

// Error Boundary
export { ErrorBoundary, type ErrorBoundaryProps } from "./ErrorBoundary";

// Re-export from shared for convenience
export {
  AppError,
  ErrorCodes,
  Errors,
  isAppError,
  getErrorInfo,
  type ErrorCode,
  type ErrorIngestorConfig,
  type CaptureOptions,
  type ErrorEvent,
} from "@error-ingestor/shared";
