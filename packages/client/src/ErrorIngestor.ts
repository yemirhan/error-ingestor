import { Result, ok, err } from "neverthrow";
import type {
  ErrorEvent,
  ErrorIngestorConfig,
  CaptureOptions,
  InAppConfig,
} from "@error-ingestor/shared";
import { AppError, isAppError, ErrorCodes } from "@error-ingestor/shared";
import { ErrorQueue } from "./queue";
import { generateUUID, getPlatformInfo, createLogger } from "./utils";
import { parseStackTrace } from "./stackParser";

interface InternalConfig extends Required<Omit<ErrorIngestorConfig, "userId" | "inAppConfig">> {
  userId?: string;
  inAppConfig?: InAppConfig;
}

const DEFAULT_CONFIG = {
  batchSize: 10,
  flushInterval: 5000,
  maxRetries: 3,
  debug: false,
  parseStack: true,
} as const;

class ErrorIngestorClient {
  private static instance: ErrorIngestorClient | null = null;
  private config: InternalConfig | null = null;
  private queue: ErrorQueue | null = null;
  private isInitialized = false;
  private logger = createLogger(false);

  private constructor() {}

  private static getInstance(): ErrorIngestorClient {
    if (!this.instance) {
      this.instance = new ErrorIngestorClient();
    }
    return this.instance;
  }

  /**
   * Initialize the ErrorIngestor client.
   * Must be called once before capturing any errors.
   */
  static init(config: ErrorIngestorConfig): Result<void, Error> {
    const instance = this.getInstance();

    if (instance.isInitialized) {
      return err(new Error("ErrorIngestor already initialized"));
    }

    // Validate required config
    if (!config.apiKey || !config.appId || !config.endpoint) {
      return err(
        new Error("apiKey, appId, and endpoint are required")
      );
    }

    // Merge with defaults
    instance.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    instance.logger = createLogger(instance.config.debug);
    instance.logger.log("Initializing with config:", {
      appId: config.appId,
      endpoint: config.endpoint,
      batchSize: instance.config.batchSize,
      flushInterval: instance.config.flushInterval,
    });

    // Create queue
    instance.queue = new ErrorQueue({
      batchSize: instance.config.batchSize,
      flushInterval: instance.config.flushInterval,
      maxRetries: instance.config.maxRetries,
      endpoint: instance.config.endpoint,
      apiKey: instance.config.apiKey,
      debug: instance.config.debug,
    });

    // Set up global error handler
    instance.setupGlobalHandler();

    instance.isInitialized = true;
    instance.logger.log("Initialized successfully");

    return ok(undefined);
  }

  /**
   * Capture an error and queue it for sending.
   */
  static capture(
    error: Error | AppError,
    options?: CaptureOptions
  ): Result<void, Error> {
    const instance = this.getInstance();

    if (!instance.isInitialized || !instance.config || !instance.queue) {
      return err(new Error("ErrorIngestor not initialized. Call init() first."));
    }

    const event = instance.createEvent(error, options);
    instance.queue.add(event);

    return ok(undefined);
  }

  /**
   * Update the user ID for future error events.
   */
  static setUserId(userId: string | null): void {
    const instance = this.getInstance();
    if (instance.config) {
      instance.config.userId = userId ?? undefined;
      instance.logger.log("User ID updated:", userId);
    }
  }

  /**
   * Force flush all queued events immediately.
   */
  static async flush(): Promise<void> {
    const instance = this.getInstance();
    if (instance.queue) {
      await instance.queue.flush();
    }
  }

  /**
   * Get the number of events currently in the queue.
   */
  static getQueueSize(): number {
    const instance = this.getInstance();
    return instance.queue?.getQueueSize() ?? 0;
  }

  /**
   * Check if the client is initialized.
   */
  static isReady(): boolean {
    return this.getInstance().isInitialized;
  }

  /**
   * Destroy the client and flush remaining events.
   */
  static destroy(): void {
    const instance = this.getInstance();
    if (instance.queue) {
      instance.queue.destroy();
      instance.queue = null;
    }
    instance.config = null;
    instance.isInitialized = false;
    instance.logger.log("Destroyed");
  }

  private createEvent(
    error: Error | AppError,
    options?: CaptureOptions
  ): ErrorEvent {
    const config = this.config!;
    const platformInfo = getPlatformInfo();

    const code = isAppError(error) ? error.code : ErrorCodes.UNKNOWN;
    const metadata = isAppError(error)
      ? { ...error.metadata, ...options?.metadata }
      : options?.metadata;

    const stackTrace = error.stack ?? "";
    const parsedStack = config.parseStack
      ? parseStackTrace(stackTrace, platformInfo.platform, config.inAppConfig)
      : undefined;

    return {
      id: generateUUID(),
      code,
      message: error.message,
      stackTrace,
      parsedStack,
      appId: config.appId,
      appVersion: config.appVersion,
      platform: platformInfo.platform,
      platformVersion: platformInfo.platformVersion,
      userId: options?.userId ?? config.userId,
      timestamp: new Date().toISOString(),
      metadata,
      tags: options?.tags,
    };
  }

  private setupGlobalHandler(): void {
    // Get global object (works in both Node.js and browsers)
    const globalObj = typeof globalThis !== "undefined"
      ? globalThis
      : typeof self !== "undefined"
        ? self
        : typeof window !== "undefined"
          ? window
          : ({} as Record<string, unknown>);

    // Try to set up React Native global handler
    try {
      // Check if ErrorUtils is available (React Native)
      const globalRecord = globalObj as Record<string, unknown>;
      if ("ErrorUtils" in globalRecord) {
        const ErrorUtils = globalRecord["ErrorUtils"] as {
          getGlobalHandler: () => ((error: Error, isFatal: boolean) => void) | null;
          setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
        };

        const originalHandler = ErrorUtils.getGlobalHandler();

        ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
          this.logger.log("Global error caught:", error.message, "fatal:", isFatal);

          ErrorIngestorClient.capture(error, {
            tags: { fatal: String(isFatal), source: "global-handler" },
          });

          // Force flush on fatal errors
          if (isFatal && this.queue) {
            void this.queue.flush();
          }

          // Call original handler
          originalHandler?.(error, isFatal);
        });

        this.logger.log("React Native global handler installed");
      }
    } catch (e) {
      this.logger.warn("Could not set up global handler:", e);
    }

    // Also set up unhandled promise rejection handler
    try {
      const globalRecord = globalObj as Record<string, unknown>;
      const originalRejectionHandler = globalRecord["onunhandledrejection"] as
        | ((event: { reason: unknown }) => void)
        | undefined;

      globalRecord["onunhandledrejection"] = (event: { reason: unknown }) => {
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));

        ErrorIngestorClient.capture(error, {
          tags: { source: "unhandled-rejection" },
        });

        originalRejectionHandler?.(event);
      };
    } catch {
      // Ignore if we can't set up the handler
    }
  }
}

export const ErrorIngestor = ErrorIngestorClient;
