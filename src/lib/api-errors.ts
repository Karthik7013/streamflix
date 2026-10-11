import { z } from "zod";
import { NextResponse } from "next/server";

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

export function apiError(message: string, code: ErrorCode, status: number, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: details === undefined ? { message, code } : { message, code, details } },
    { status }
  );
}

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { data: z.infer<T> } | { error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: apiError("Validation failed", ErrorCode.ValidationError, 400, result.error.flatten()),
    };
  }
  return { data: result.data as z.infer<T> };
}