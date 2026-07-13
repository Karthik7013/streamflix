import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { logger } from "@/lib/logger";

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

type ErrorConfig = string | { message: string; code: string };

function normalizeError(err: ErrorConfig): { message: string; code: string } {
  return typeof err === "string" ? { message: err, code: "INTERNAL_ERROR" } : err;
}

function errorResponse(status: number, config: ErrorConfig): NextResponse {
  const { message, code } = normalizeError(config);
  return NextResponse.json({ error: { message, code } }, { status });
}

/**
 * Wraps a Next.js route handler so it only runs for authenticated requests.
 * Resolves `params`, resolves the session, and centralizes error logging +
 * the generic 500 response so individual routes don't need their own
 * try/catch for the unhandled-error case.
 */
export function withAuth<P = Record<string, never>>(handler: Handler<P>, errorConfig?: ErrorConfig) {
  const defaultError = errorConfig ?? { message: "Something went wrong", code: "INTERNAL_ERROR" };
  return async (request: NextRequest, context?: NextRouteContext<P>) => {
    const session = await getCachedSession(request);
    if (!session) {
      return errorResponse(401, { message: "Unauthorized", code: "UNAUTHORIZED" });
    }
    return runHandler(handler, request, context, session, defaultError);
  };
}

/**
 * Same as `withAuth`, but additionally requires `session.user.role === "admin"`.
 * This replaces the inline
 *   const session = await getCachedSession(request);
 *   if (!session || session.user.role !== "admin") { ... }
 * block that was previously copy-pasted into every admin route.
 */
export function withAdminAuth<P = Record<string, never>>(handler: Handler<P>, errorConfig?: ErrorConfig) {
  const defaultError = errorConfig ?? { message: "Something went wrong", code: "INTERNAL_ERROR" };
  return async (request: NextRequest, context?: NextRouteContext<P>) => {
    const session = await getCachedSession(request);
    if (!session || session.user.role !== "admin") {
      return errorResponse(401, { message: "Unauthorized", code: "UNAUTHORIZED" });
    }
    return runHandler(handler, request, context, session, defaultError);
  };
}

async function runHandler<P>(
  handler: Handler<P>,
  request: NextRequest,
  context: NextRouteContext<P> | undefined,
  session: Session,
  errorConfig: ErrorConfig
) {
  try {
    const params = context ? await context.params : ({} as P);
    return await handler(request, { params, session });
  } catch (err) {
    logger.error(`${request.method} ${request.nextUrl.pathname}`, err);
    return errorResponse(500, errorConfig);
  }
}
