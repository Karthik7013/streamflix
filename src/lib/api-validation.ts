import { z } from "zod";
import { NextResponse } from "next/server";
import { ErrorCode } from "@/lib/error-codes";
import { apiError } from "@/lib/api-errors";

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
