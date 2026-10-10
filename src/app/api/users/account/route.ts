import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { deleteAccount } from "@/services/users";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const DELETE = withAuth(async (request, { session }) => {
  await deleteAccount(session.user.id, request.headers);
  return NextResponse.json({ data: { success: true } }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
}, { message: "Delete Failed", code: "INTERNAL_ERROR" });
