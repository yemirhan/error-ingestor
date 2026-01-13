import { AppError } from "@error-ingestor/client";

/**
 * Custom error codes for the Next.js app
 */
export const AppErrorCodes = {
  // Client errors
  FORM_VALIDATION: "client/form-validation",
  RENDER_ERROR: "client/render-error",

  // API errors
  API_ERROR: "api/error",
  API_NOT_FOUND: "api/not-found",
  API_UNAUTHORIZED: "api/unauthorized",

  // Server errors
  SERVER_ERROR: "server/internal-error",
  DATABASE_ERROR: "server/database-error",
} as const;

export type AppErrorCode = (typeof AppErrorCodes)[keyof typeof AppErrorCodes];

/**
 * Factory functions for common errors
 */
export const AppErrors = {
  formValidation: (field: string, message: string) =>
    new AppError(AppErrorCodes.FORM_VALIDATION, message, { field }),

  apiError: (endpoint: string, status: number) =>
    new AppError(AppErrorCodes.API_ERROR, `API error: ${status}`, {
      endpoint,
      status,
    }),

  serverError: (message: string) =>
    new AppError(AppErrorCodes.SERVER_ERROR, message),
};
