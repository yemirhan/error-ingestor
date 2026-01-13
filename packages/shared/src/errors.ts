/** Error codes used throughout the app */
export const ErrorCodes = {
  // Auth errors
  USER_NOT_FOUND: "auth/user-not-found",
  USER_NOT_AUTHENTICATED: "auth/user-not-authenticated",
  INVALID_CREDENTIALS: "auth/invalid-credentials",
  PREMIUM_REQUIRED: "auth/premium-required",
  SESSION_EXPIRED: "auth/session-expired",
  UNAUTHORIZED: "auth/unauthorized",

  // Network errors
  NETWORK_ERROR: "network/request-failed",
  TIMEOUT: "network/timeout",

  // Firestore errors
  DOCUMENT_NOT_FOUND: "firestore/document-not-found",
  FETCH_FAILED: "firestore/fetch-failed",
  FUNNEL_ANSWERS_NOT_FOUND: "firestore/funnel-answers-not-found",

  // Validation errors
  VALIDATION_ERROR: "validation/invalid-input",
  MISSING_FIELD: "validation/missing-field",

  // General errors
  UNKNOWN: "unknown/unhandled",
  INTERNAL: "internal/server-error",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Custom error class with typed error codes */
export class AppError extends Error {
  readonly code: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.timestamp = new Date();
    this.metadata = metadata;

    // Maintains proper stack trace in V8 environments
    const ErrorWithCapture = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: Function) => void;
    };
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, AppError);
    }
  }

  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      metadata: this.metadata,
    };
  }
}

/** Pre-defined errors for common use cases */
export const Errors = {
  userNotAuthenticated: () =>
    new AppError(
      ErrorCodes.USER_NOT_AUTHENTICATED,
      "User is not authenticated"
    ),
  userNotFound: () =>
    new AppError(ErrorCodes.USER_NOT_FOUND, "User not found"),
  documentNotFound: (collection: string) =>
    new AppError(
      ErrorCodes.DOCUMENT_NOT_FOUND,
      `Document not found in ${collection}`
    ),
  premiumRequired: () =>
    new AppError(ErrorCodes.PREMIUM_REQUIRED, "Premium subscription required"),
  fetchFailed: (resource: string) =>
    new AppError(ErrorCodes.FETCH_FAILED, `Failed to fetch ${resource}`),
  funnelAnswersNotFound: () =>
    new AppError(
      ErrorCodes.FUNNEL_ANSWERS_NOT_FOUND,
      "Funnel answers not found"
    ),
  networkError: (details?: string) =>
    new AppError(
      ErrorCodes.NETWORK_ERROR,
      details ?? "Network request failed"
    ),
  unknown: (message?: string) =>
    new AppError(ErrorCodes.UNKNOWN, message ?? "An unknown error occurred"),
} as const;

/** Type guard to check if an error is an AppError */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

/** Helper to safely extract error info from catch blocks */
export const getErrorInfo = (error: unknown) => {
  if (isAppError(error)) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: ErrorCodes.UNKNOWN, message: error.message };
  }
  return { code: ErrorCodes.UNKNOWN, message: "An unknown error occurred" };
};
