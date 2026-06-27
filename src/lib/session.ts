import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function getCachedSession(request: NextRequest) {
  return auth.api.getSession({ headers: request.headers });
}

export async function requireAdmin(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") return null;
  return session;
}
