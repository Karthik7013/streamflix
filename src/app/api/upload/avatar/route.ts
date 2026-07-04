import { NextResponse } from "next/server";
import { validateFileType, uploadToIA } from "@/services/upload";
import { withAuth } from "@/lib/with-auth";

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function extFromContentType(contentType: string): string {
  return EXTENSION_MAP[contentType] || "png";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const POST = withAuth(async (request, { session }) => {
  const contentType = request.headers.get("content-type") || "image/png";

  const validationError = validateFileType("avatar.png", contentType);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  const userId = session.user.id;
  const ext = extFromContentType(contentType);
  const key = `users/${userId}/profile/01.${ext}`;

  await uploadToIA({
    fileName: `avatar.${ext}`,
    buffer,
    contentType,
    key,
  });

  const bucket = requireEnv("IA_S3_BUCKET");
  const publicUrl = `https://archive.org/download/${bucket}/${key}`;

  return NextResponse.json({ publicUrl });
}, "Upload Failed");
