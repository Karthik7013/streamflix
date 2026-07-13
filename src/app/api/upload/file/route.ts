import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { validateFileType, uploadToIA, deleteFile } from "@/lib/upload-utils";

export const POST = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");
  if (!fileName) {
    return NextResponse.json({ error: { message: "fileName query parameter is required", code: "FILE_NAME_REQUIRED" } }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") || "application/octet-stream";

  const validationError = validateFileType(fileName, contentType);
  if (validationError) {
    return NextResponse.json({ error: { message: validationError, code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const contentLength = request.headers.get("content-length");
  const body = request.body;

  if (!body || !contentLength) {
    return NextResponse.json({ error: { message: "Missing request body", code: "BODY_REQUIRED" } }, { status: 400 });
  }

  try {
    const folder = searchParams.get("folder") || "uploads";
    const key = searchParams.get("key") || undefined;

    const { publicUrl } = await uploadToIA({
      fileName,
      stream: body,
      size: parseInt(contentLength, 10),
      contentType,
      folder,
      key,
    });
    return NextResponse.json({ data: { publicUrl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload Failed";
    return NextResponse.json({ error: { message, code: "INTERNAL_ERROR" } }, { status: 500 });
  }
});

export const DELETE = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: { message: "url query parameter is required", code: "URL_REQUIRED" } }, { status: 400 });
  }

  try {
    await deleteFile(url);
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete Failed";
    return NextResponse.json({ error: { message, code: "INTERNAL_ERROR" } }, { status: 500 });
  }
});
