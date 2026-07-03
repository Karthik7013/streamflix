import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";

type Session = NonNullable<Awaited<ReturnType<typeof getCachedSession>>>;

export interface RouteContext<P> {
  params: P;
  session: Session;
}

type Handler<P> = (
  request: NextRequest,
  context: RouteContext<P>
) => Promise<Response>;

type NextRouteContext<P> = { params: Promise<P> };

/**
 * Wraps a Next.js route handler so it only runs for authenticated requests.
 * Resolves `params`, resolves the session, and centralizes error logging +
 * the generic 500 response so individual routes don't need their own
 * try/catch for the unhandled-error case.
 */
export function withAuth<P = Record<string, never>>(handler: Handler<P>) {
  return async (request: NextRequest, context?: NextRouteContext<P>) => {
    const session = await getCachedSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return runHandler(handler, request, context, session);
  };
}

/**
 * Same as `withAuth`, but additionally requires `session.user.role === "admin"`.
 * This replaces the inline
 *   const session = await getCachedSession(request);
 *   if (!session || session.user.role !== "admin") { ... }
 * block that was previously copy-pasted into every admin route.
 */
export function withAdminAuth<P = Record<string, never>>(handler: Handler<P>) {
  return async (request: NextRequest, context?: NextRouteContext<P>) => {
    const session = await getCachedSession(request);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return runHandler(handler, request, context, session);
  };
}

async function runHandler<P>(
  handler: Handler<P>,
  request: NextRequest,
  context: NextRouteContext<P> | undefined,
  session: Session
) {
  try {
    const params = context ? await context.params : ({} as P);
    return await handler(request, { params, session });
  } catch (err) {
    console.error(`[${request.method} ${request.nextUrl.pathname}]`, err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
