import { AppError } from "@error-ingestor/client";

/**
 * Custom error codes for this app
 */
export const AppErrorCodes = {
  // API errors
  API_REQUEST_FAILED: "api/request-failed",
  API_TIMEOUT: "api/timeout",
  API_UNAUTHORIZED: "api/unauthorized",

  // User errors
  USER_NOT_FOUND: "user/not-found",
  USER_INVALID_INPUT: "user/invalid-input",

  // Feature errors
  FEATURE_NOT_AVAILABLE: "feature/not-available",
  FEATURE_QUOTA_EXCEEDED: "feature/quota-exceeded",
} as const;

export type AppErrorCode = (typeof AppErrorCodes)[keyof typeof AppErrorCodes];

/**
 * Factory functions for common errors
 */
export const AppErrors = {
  apiRequestFailed: (endpoint: string, statusCode?: number) =>
    new AppError(AppErrorCodes.API_REQUEST_FAILED, `API request to ${endpoint} failed`, {
      endpoint,
      statusCode,
    }),

  apiTimeout: (endpoint: string) =>
    new AppError(AppErrorCodes.API_TIMEOUT, `Request to ${endpoint} timed out`, {
      endpoint,
    }),

  userNotFound: (userId: string) =>
    new AppError(AppErrorCodes.USER_NOT_FOUND, `User ${userId} not found`, {
      userId,
    }),

  featureNotAvailable: (feature: string) =>
    new AppError(
      AppErrorCodes.FEATURE_NOT_AVAILABLE,
      `Feature "${feature}" is not available`,
      { feature }
    ),
};
