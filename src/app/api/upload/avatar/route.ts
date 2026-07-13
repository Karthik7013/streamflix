import { NextResponse } from "next/server";
import { validateFileType, uploadToIA } from "@/lib/upload-utils";
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
  return EXTENSION_MAP[contentType] ?? "png";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export const POST = withAuth(async (request, { session }) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: { message: "No file provided", code: "FILE_REQUIRED" } }, { status: 400 });
  }

  const contentType = file.type;
  const validationError = validateFileType(file.name, contentType);
  if (validationError) {
    return NextResponse.json({ error: { message: validationError, code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const userId = session.user.id;
  const ext = extFromContentType(contentType);
  const key = `users/${userId}/profile/01.${ext}`;

  await uploadToIA({
    fileName: file.name,
    stream: file.stream(),
    size: file.size,
    contentType,
    key,
  });

  const bucket = requireEnv("IA_S3_BUCKET");
  const publicUrl = `https://archive.org/download/${bucket}/${key}`;

  return NextResponse.json({ data: { publicUrl } });
}, { message: "Upload Failed", code: "INTERNAL_ERROR" });
