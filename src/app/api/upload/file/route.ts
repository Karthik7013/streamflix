import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { safeParseInt, CACHE_CONTROL } from "@/lib/api-utils";
import { ErrorCode } from "@/lib/error-codes";
import { validateFileType, uploadToIA, deleteFile } from "@/lib/upload-utils";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-errors";

export const POST = withAdminAuth(async (request, { session }) => {
  const { allowed } = await rateLimit(`upload:${session.user.id}`, 20, 60_000);
  if (!allowed) return rateLimitResponse();

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");
  if (!fileName) {
    return NextResponse.json({ error: { message: "fileName query parameter is required", code: ErrorCode.ValidationError } }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") || "application/octet-stream";

  const validationError = validateFileType(fileName, contentType);
  if (validationError) {
    return NextResponse.json({ error: { message: validationError, code: ErrorCode.ValidationError } }, { status: 400 });
  }

  const contentLength = request.headers.get("content-length");
  const body = request.body;

  if (!body || !contentLength) {
    return NextResponse.json({ error: { message: "Missing request body", code: ErrorCode.ValidationError } }, { status: 400 });
  }

  try {
    const folder = searchParams.get("folder") || "uploads";
    const key = searchParams.get("key") || undefined;

    const { publicUrl } = await uploadToIA({
      fileName,
      stream: body,
      size: safeParseInt(contentLength, 0),
      contentType,
      folder,
      key,
    });
    return NextResponse.json({ data: { publicUrl } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload Failed";
    logger.error("upload/file", "File upload failed", err);
    return apiError(message, ErrorCode.InternalError, 500);
  }
});

export const DELETE = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: { message: "url query parameter is required", code: ErrorCode.ValidationError } }, { status: 400 });
  }

  try {
    await deleteFile(url);
    return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete Failed";
    logger.error("upload/file", "File delete failed", err);
    return apiError(message, ErrorCode.InternalError, 500);
  }
});
