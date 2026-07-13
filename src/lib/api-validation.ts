import { z } from "zod";
import { NextResponse } from "next/server";

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { data: z.infer<T> } | { error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: { message: "Validation failed", code: "VALIDATION_ERROR", details: result.error.flatten() } },
        { status: 400 }
      ),
    };
  }
  return { data: result.data as z.infer<T> };
}
