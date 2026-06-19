import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isExtensionBlocked } from "@/lib/upload-utils";

const ENDPOINT = process.env.IA_S3_ENDPOINT!;
const ACCESS_KEY = process.env.IA_S3_ACCESS_KEY!;
const SECRET_KEY = process.env.IA_S3_SECRET_KEY!;
const BUCKET = process.env.IA_S3_BUCKET!;
const PUBLIC_BASE = `https://archive.org/download/${BUCKET}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    const folder = searchParams.get("folder") || "uploads";

    if (!fileName) {
      return NextResponse.json({ error: "Missing fileName query param" }, { status: 400 });
    }

    if (isExtensionBlocked(fileName)) {
      return NextResponse.json({ error: "This file type is not allowed" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const contentLength = request.headers.get("content-length");

    if (!request.body) {
      return NextResponse.json({ error: "No request body" }, { status: 400 });
    }

    if (!contentLength) {
      return NextResponse.json({ error: "Missing Content-Length header" }, { status: 400 });
    }

    const uuid = crypto.randomUUID();
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folder}/${uuid}-${sanitized}`;
    const iaUrl = `${ENDPOINT}/${BUCKET}/${key}`;

    const res = await fetch(iaUrl, {
      method: "PUT",
      body: request.body,
      duplex: "half",
      headers: {
        "Content-Type": contentType,
        "Content-Length": contentLength!,
        Authorization: `LOW ${ACCESS_KEY}:${SECRET_KEY}`,
      },
    } as RequestInit & { duplex: "half" });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `IA S3 error (${res.status}): ${text.slice(0, 200)}` }, { status: 502 });
    }

    return NextResponse.json({ publicUrl: `${PUBLIC_BASE}/${key}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
