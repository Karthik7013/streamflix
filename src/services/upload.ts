import { isExtensionBlocked, deleteFromIA } from "@/lib/upload-utils";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const ALLOWED_CONTENT_TYPES = ["application/octet-stream", "video/", "image/"];

export function validateFileType(fileName: string, contentType: string): string | null {
  if (isExtensionBlocked(fileName)) {
    return "File type not allowed";
  }

  const isAllowed = ALLOWED_CONTENT_TYPES.some(
    (prefix) => contentType === prefix || contentType.startsWith(prefix)
  );
  if (!isAllowed) {
    return "Only video and image files are allowed";
  }

  return null;
}

export async function uploadToIA(data: {
  fileName: string;
  buffer: Buffer;
  contentType: string;
  folder?: string;
  key?: string;
}): Promise<{ publicUrl: string }> {
  const { fileName, buffer, contentType, folder, key: directKey } = data;

  const key = directKey ?? (() => {
    const sanitizedFolder = (folder ?? "").replace(/[^a-zA-Z0-9_\/-]/g, "");
    return sanitizedFolder
      ? `${sanitizedFolder}/${Date.now()}-${fileName}`
      : `${Date.now()}-${fileName}`;
  })();

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
      Authorization: `LOW ${accessKey}:${secretKey}`,
      "x-amz-auto-make-bucket": "1",
      "x-archive-meta-mediatype": contentType.startsWith("video/") ? "movies" : "image",
      "x-archive-meta-collection": "opensource",
    "Content-Type": contentType,
  },
  body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Upload failed: ${text}`);
  }

  return { publicUrl: url };
}

export function buildIAUrl(key: string): string {
  const bucket = requireEnv("IA_S3_BUCKET");
  const endpoint = requireEnv("IA_S3_ENDPOINT");
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
  return `${endpoint}/${bucket}/${encodedKey}`;
}

export async function deleteFile(url: string): Promise<void> {
  await deleteFromIA(url);
}
