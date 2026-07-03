import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { fulfillRequest, deleteRequest } from "@/services/requests";

export const PATCH = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const requestId = parseInt(params.id);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !["pending", "fulfilled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status === "fulfilled") {
    const result = await fulfillRequest(requestId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result.request);
  }

  return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
});

export const DELETE = withAdminAuth<{ id: string }>(async (_request, { params }) => {
  const requestId = parseInt(params.id);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const deleted = await deleteRequest(requestId);
  if (!deleted) {
    return NextResponse.json({ error: "Request Not Found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
