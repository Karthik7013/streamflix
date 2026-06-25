import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminMovies, createMovie, validateSlug } from "@/services/movies";

const IGNORED_PARAMS = new Set(["page", "limit", "search", "sortBy", "sortDir"]);

function extractColumnFilters(searchParams: URLSearchParams): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!IGNORED_PARAMS.has(key) && value) {
      filters[key] = value;
    }
  }
  return filters;
}

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || undefined;
  const columnFilters = extractColumnFilters(searchParams);

  try {
    const result = await listAdminMovies({ page, limit, search, sortBy, sortDir, columnFilters });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields: title, slug" }, { status: 400 });
    }

    const slugError = validateSlug(slug);
    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 400 });
    }

    const createdMovie = await createMovie(body);
    return NextResponse.json(createdMovie, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create Failed" }, { status: 500 });
  }
}
