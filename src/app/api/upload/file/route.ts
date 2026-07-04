import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { validateFileType, uploadToIA, deleteFile } from "@/lib/upload-utils";

export const POST = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("fileName");
  if (!fileName) {
    return NextResponse.json({ error: "fileName query parameter is required" }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") || "application/octet-stream";

  const validationError = validateFileType(fileName, contentType);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await request.arrayBuffer());
    const folder = searchParams.get("folder") || "uploads";
    const key = searchParams.get("key") || undefined;

    const { publicUrl } = await uploadToIA({ fileName, buffer, contentType, folder, key });
    return NextResponse.json({ publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
  }

  try {
    await deleteFile(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
