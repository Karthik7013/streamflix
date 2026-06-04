import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

const { GET: handler, POST: postHandler } = toNextJsHandler(auth);

export const GET = (request: NextRequest, _ctx: { params: Promise<{ all: string[] }> }) => handler(request);
export const POST = (request: NextRequest, _ctx: { params: Promise<{ all: string[] }> }) => postHandler(request);
