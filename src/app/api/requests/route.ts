import { NextResponse } from "next/server";
import { createRequest } from "@/services/requests";
import { withAuth } from "@/lib/with-auth";

export const POST = withAuth(async (request, { session }) => {
  if (session.user.role === "admin") {
    return NextResponse.json({ error: "Admins cannot request movies" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, externalLink } = body;

  const result = await createRequest({ userId: session.user.id, title, description, externalLink });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.request, { status: 201 });
}, "Failed to submit request");
