import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function getCachedSession(request: NextRequest) {
  return auth.api.getSession({ headers: request.headers });
}
