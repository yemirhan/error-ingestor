import type { Platform } from "./schemas";

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
