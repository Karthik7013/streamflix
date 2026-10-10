import { NextResponse } from "next/server";
import { type ErrorCode } from "@/lib/error-codes";

export function apiError(message: string, code: ErrorCode, status: number): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}
