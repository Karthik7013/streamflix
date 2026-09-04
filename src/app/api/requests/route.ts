import { NextResponse } from "next/server";
import { createRequest } from "@/services/requests";
import { withAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-validation";
import { requestFormSchema } from "@/lib/schemas";

export const POST = withAuth(async (request, { session }) => {
  const body = await request.json();

  const parsed = validateBody(requestFormSchema, body);
  if ("error" in parsed) return parsed.error;

  const { title, description, externalLink } = parsed.data;
  const result = await createRequest({ userId: session.user.id, title, description, externalLink });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ data: result.request }, { status: 201 });
}, { message: "Unable to submit request.", code: "INTERNAL_ERROR" });
