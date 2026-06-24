import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isExtensionBlocked, deleteFromIA } from "@/lib/upload-utils";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    if (!fileName) {
      return NextResponse.json({ error: "fileName query parameter is required" }, { status: 400 });
    }

    if (isExtensionBlocked(fileName)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    if (
      contentType !== "application/octet-stream" &&
      !contentType.startsWith("video/") &&
      !contentType.startsWith("image/")
    ) {
      return NextResponse.json({ error: "Only video and image files are allowed" }, { status: 400 });
    }
    const buffer = Buffer.from(await request.arrayBuffer());

    const folder = searchParams.get("folder") || "uploads";
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\/-]/g, "");
    const key = sanitizedFolder ? `${sanitizedFolder}/${Date.now()}-${fileName}` : `${Date.now()}-${fileName}`;

    const accessKey = requireEnv("IA_S3_ACCESS_KEY");
    const secretKey = requireEnv("IA_S3_SECRET_KEY");
    const bucket = requireEnv("IA_S3_BUCKET");
    const endpoint = requireEnv("IA_S3_ENDPOINT");

    const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
    const resource = `/${bucket}/${encodedKey}`;
    const url = `${endpoint}${resource}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `LOW ${accessKey}:${secretKey}`,
        "x-amz-auto-make-bucket": "1",
        "x-archive-meta-mediatype": contentType.startsWith("video/") ? "movies" : "image",
        "x-archive-meta-collection": "opensource",
        "Content-Type": contentType,
      },
      body: buffer,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `Upload failed: ${text}` }, { status: 500 });
    }

    return NextResponse.json({ publicUrl: url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
    }

    await deleteFromIA(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
