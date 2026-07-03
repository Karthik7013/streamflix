import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { deleteAccount } from "@/services/users";

export const DELETE = withAuth(async (request, { session }) => {
  await deleteAccount(session.user.id, request.headers);
  return NextResponse.json({ success: true });
}, "Delete Failed");
