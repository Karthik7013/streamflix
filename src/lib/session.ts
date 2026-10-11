import { auth } from "@/lib/auth";

export async function getCachedSession(request: { headers: Headers }) {
  return auth.api.getSession({ headers: request.headers });
}
