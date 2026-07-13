import { NextResponse } from "next/server";

export interface ApiErrorBody {
  message: string;
  code: string;
}

export function apiError(status: number, message: string, code: string): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}
