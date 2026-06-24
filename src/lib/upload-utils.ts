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
