// Main client
export { ErrorIngestor } from "./ErrorIngestor";

// Error Boundary
export { ErrorBoundary, type ErrorBoundaryProps } from "./ErrorBoundary";

// Stack parser utilities
export {
  parseStackTrace,
  isInAppFrame,
  DEFAULT_EXCLUDE_PATTERNS,
} from "./stackParser";

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
  type StackFrame,
  type ParsedStackTrace,
  type InAppConfig,
} from "@error-ingestor/shared";
