import { NextResponse } from "next/server";
import { type ErrorCode } from "@/lib/error-codes";

export function apiError(message: string, code: ErrorCode, status: number, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: details === undefined ? { message, code } : { message, code, details } },
    { status }
  );
}
