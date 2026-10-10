import { NextResponse } from "next/server";
import { validateFileType, uploadToIA, extFromContentType, requireEnv } from "@/lib/upload-utils";
import { withAuth } from "@/lib/with-auth";

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
  const key = `users/${userId}/profile/02.${ext}`;
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
}, { message: "Cover Upload Failed", code: "INTERNAL_ERROR" });
