import { NextResponse } from "next/server";
import { createRequest } from "@/services/requests";
import { withAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-validation";
import { requestFormSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const POST = withAuth(async (request, { session }) => {
  const { allowed } = await rateLimit(`requests:${session.user.id}`, 10, 3_600_000);
  if (!allowed) return rateLimitResponse();

  const body = await request.json();

  const parsed = validateBody(requestFormSchema, body);
  if ("error" in parsed) return parsed.error;

  const { title, description, externalLink } = parsed.data;
  const result = await createRequest({ userId: session.user.id, title, description, externalLink });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ data: result.request }, { status: 201, headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
}, { message: "Unable to submit request." });
