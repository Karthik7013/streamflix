import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BLOCKED_BOTS = [
  "semrush",
  "ahrefs",
  "mj12bot",
  "dotbot",
  "blexbot",
  "dataforseo",
  "petalbot",
  "sogou",
  "exabot",
  "ia_archiver",
  "archive.org_bot",
  "censys",
  "shodan",
  "masscan",
  "zgrab",
];

export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";

  for (const bot of BLOCKED_BOTS) {
    if (ua.includes(bot)) {
      return new NextResponse(null, { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-response-time", Date.now().toString());
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
