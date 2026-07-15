import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "video.twimg.com",
  "archive.org",
  "s3.us.archive.org",
];

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: { message: "Missing 'url' query parameter", code: "MISSING_URL" } }, { status: 400 });
  }

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return NextResponse.json({ error: { message: "Invalid URL", code: "INVALID_URL" } }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
    return NextResponse.json({ error: { message: "Domain not allowed", code: "FORBIDDEN_DOMAIN" } }, { status: 403 });
  }

  const range = request.headers.get("range") || "";

  try {
    const upstream = await fetch(url, {
      headers: {
        Referer: "https://twitter.com/",
        ...(range ? { Range: range } : {}),
      },
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: { message: "Upstream request failed", code: "UPSTREAM_ERROR" } }, { status: upstream.status });
    }

    const headers: Record<string, string> = {
      "Content-Type": upstream.headers.get("content-type") || "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    };

    const contentRange = upstream.headers.get("content-range");
    const contentLength = upstream.headers.get("content-length");
    if (contentRange) headers["Content-Range"] = contentRange;
    if (contentLength) headers["Content-Length"] = contentLength;
    if (range) headers["Accept-Ranges"] = "bytes";

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return NextResponse.json({ error: { message: "Failed to fetch video", code: "FETCH_ERROR" } }, { status: 502 });
  }
}
