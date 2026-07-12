import { createHmac } from "node:crypto";

export const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif",
  ".js", ".html", ".htm", ".xhtml", ".php", ".asp", ".aspx", ".jsp",
  ".sh", ".bash", ".vbs", ".ps1", ".psm1",
  ".jar", ".war",
  ".dmg", ".app", ".deb", ".rpm",
]);

export function isExtensionBlocked(fileName: string): boolean {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return BLOCKED_EXTENSIONS.has(ext);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function signStringToSign(secretKey: string, stringToSign: string): string {
  return createHmac("sha1", secretKey).update(stringToSign).digest("base64");
}

function buildStringToSign(
  method: string,
  contentType: string,
  date: string,
  amzHeaders: string,
  resource: string,
): string {
  return [method, "", contentType, date, amzHeaders, resource].join("\n");
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
  contentType: string;
  folder?: string;
  key?: string;
} & ({ buffer: Buffer } | { stream: ReadableStream; size: number })): Promise<{ publicUrl: string }> {
  const { fileName, contentType, folder, key: directKey } = data;

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

  const headers: Record<string, string> = {
    Authorization: `LOW ${accessKey}:${secretKey}`,
    "x-amz-auto-make-bucket": "1",
    "x-archive-meta-mediatype": contentType.startsWith("video/") ? "movies" : "image",
    "x-archive-meta-collection": "opensource",
    "Content-Type": contentType,
  };

  let body: BodyInit;
  const fetchOptions: RequestInit & { duplex?: string } = {
    method: "PUT",
    headers,
  };

  if ("buffer" in data) {
    fetchOptions.body = new Uint8Array(data.buffer);
  } else {
    fetchOptions.body = data.stream;
    headers["Content-Length"] = String(data.size);
    fetchOptions.duplex = "half";
  }

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Upload failed: ${text}`);
  }

  return { publicUrl: `https://archive.org/download/${bucket}/${encodedKey}` };
}

export function buildIAUrl(key: string): string {
  const bucket = requireEnv("IA_S3_BUCKET");
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
  return `https://archive.org/download/${bucket}/${encodedKey}`;
}

export async function deleteFile(url: string): Promise<void> {
  await deleteFromIA(url);
}

export async function deleteFromIA(url: string): Promise<void> {
  const accessKey = requireEnv("IA_S3_ACCESS_KEY");
  const secretKey = requireEnv("IA_S3_SECRET_KEY");
  const bucket = requireEnv("IA_S3_BUCKET");
  const endpoint = requireEnv("IA_S3_ENDPOINT");

  const urlObj = new URL(url);
  if (!urlObj.pathname.startsWith(`/${bucket}/`)) return;
  const key = urlObj.pathname.slice(bucket.length + 2);

  const date = new Date().toUTCString();
  const resource = `/${bucket}/${key}`;
  const stringToSign = buildStringToSign("DELETE", "", date, "", resource);
  const signature = signStringToSign(secretKey, stringToSign);

  const res = await fetch(`${endpoint}${resource}`, {
    method: "DELETE",
    headers: {
      Authorization: `LOW ${accessKey}:${signature}`,
      Date: date,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Delete failed: ${text}`);
  }
}
