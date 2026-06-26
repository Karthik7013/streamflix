import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { validateFileType, uploadToIA, deleteFile } from "@/services/upload";

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const buffer = Buffer.from(await request.arrayBuffer());
    const folder = searchParams.get("folder") || "uploads";
    const key = searchParams.get("key") || undefined;

    const { publicUrl } = await uploadToIA({ fileName, buffer, contentType, folder, key });
    return NextResponse.json({ publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
    }

    await deleteFile(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
