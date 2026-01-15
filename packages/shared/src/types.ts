import type { Platform } from "./schemas";

/** Represents a single stack frame */
export interface StackFrame {
  /** Original function name or null if anonymous */
  functionName: string | null;
  /** File path or URL (may be minified) */
  fileName: string | null;
  /** Line number in the file (1-indexed) */
  lineNumber: number | null;
  /** Column number (1-indexed) */
  columnNumber: number | null;
  /** Whether this frame is from application code vs library/framework */
  inApp: boolean;
  /** Raw line from original stack trace */
  raw: string;
  /** Original source file after source map resolution (server-populated) */
  originalFileName?: string | null;
  /** Original line number after source map resolution (server-populated) */
  originalLineNumber?: number | null;
  /** Original column number after source map resolution (server-populated) */
  originalColumnNumber?: number | null;
  /** Original function/method name after source map resolution (server-populated) */
  originalFunctionName?: string | null;
  /** Whether this frame has been resolved via source map */
  resolved?: boolean;
}

/** Parser type used to parse the stack trace */
export type StackParser = "browser" | "react-native" | "node" | "unknown";

/** Parsed stack trace with structured frames */
export interface ParsedStackTrace {
  /** Array of parsed stack frames, most recent first */
  frames: StackFrame[];
  /** Original raw stack trace string */
  raw: string;
  /** Parser that was used */
  parser: StackParser;
}

/** Configuration for in-app frame detection */
export interface InAppConfig {
  /** Patterns to include as app code (if set, only matching frames are in-app) */
  includePatterns?: (string | RegExp)[];
  /** Patterns to exclude from app code (matched frames are not in-app) */
  excludePatterns?: (string | RegExp)[];
}

/** Configuration for the ErrorIngestor client */
export interface ErrorIngestorConfig {
  /** API key for authentication */
  apiKey: string;
  /** Unique identifier for the app */
  appId: string;
  /** Current version of the app */
  appVersion: string;
  /** Base URL of the error ingestion server */
  endpoint: string;
  /** Optional user ID for user-level tracking */
  userId?: string;
  /** Number of errors to batch before sending (default: 10) */
  batchSize?: number;
  /** Interval in ms to flush the queue (default: 5000) */
  flushInterval?: number;
  /** Maximum retry attempts for failed requests (default: 3) */
  maxRetries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Enable stack trace parsing (default: true) */
  parseStack?: boolean;
  /** Configuration for in-app frame detection */
  inAppConfig?: InAppConfig;
}

/** Options for capturing an error */
export interface CaptureOptions {
  /** Additional metadata to attach to the error */
  metadata?: Record<string, unknown>;
  /** Tags for categorization */
  tags?: Record<string, string>;
  /** Override the user ID for this specific error */
  userId?: string;
}

/** Device information collected by the client */
export interface DeviceInfo {
  platform: Platform;
  platformVersion: string;
  deviceModel?: string;
  deviceBrand?: string;
}

/** App registered in the system */
export interface App {
  id: string;
  name: string;
  apiKeyHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Dashboard filter state */
export interface ErrorFilters {
  appId: string;
  code?: string;
  userId?: string;
  startTime: Date;
  endTime: Date;
}
