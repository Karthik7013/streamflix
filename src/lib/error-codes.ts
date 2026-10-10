export const ErrorCode = {
  ValidationError: "VALIDATION_ERROR",
  InternalError: "INTERNAL_ERROR",
  Unauthorized: "UNAUTHORIZED",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  InvalidId: "INVALID_ID",
  InvalidTransition: "INVALID_TRANSITION",
  ImportFailed: "IMPORT_FAILED",
  RateLimited: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
