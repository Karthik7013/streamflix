import { streamText, convertToModelMessages, stepCountIs, type ToolSet, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { withAdminAuth } from "@/lib/with-auth";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { ErrorCode } from "@/lib/api-errors";
import { chatApiSchema } from "@/lib/schemas";
import {
  adminChatLimitSchema,
  adminChatQuerySchema,
  adminChatMovieIdSchema,
} from "@/lib/schemas";
import { getAdminStats, getMostFavorited } from "@/services/stats";
import { listAdminReports } from "@/services/reports";
import { listAdminRequests } from "@/services/requests";
import { searchMovies } from "@/services/movies";
import { getAllTags } from "@/services/tags";
import { getRecentSignups } from "@/services/users";
import { searchTMDB } from "@/services/tmdb";
import { batchMovieTags } from "@/services/movie-tags";

export const maxDuration = 30;

const kilocode = createOpenAICompatible({
  baseURL: "https://api.kilo.ai/api/gateway",
  apiKey: process.env.KILOCODE_API_KEY,
  name: "kilocode",
});

function toolFailure(tool: string, err: unknown): { error: string } {
  logger.error("admin-chat", `Tool ${tool} failed`, err);
  return { error: "That lookup is unavailable right now. Please try again." };
}

const readTools: ToolSet = {
  getDashboardStats: {
    description:
      "Get the admin dashboard stats (totals, growth). Use when the admin asks about site metrics, totals, or growth.",
    inputSchema: adminChatLimitSchema,
    execute: async () => {
      try {
        return await getAdminStats();
      } catch (err) {
        return toolFailure("getDashboardStats", err);
      }
    },
  },
  listPendingReports: {
    description:
      "List pending video reports with IDs, descriptions, movie titles, and reporters. Use for moderation triage.",
    inputSchema: adminChatLimitSchema,
    execute: async ({ limit }: { limit: number }) => {
      try {
        const result = await listAdminReports({
          page: 1,
          limit,
          sortBy: "createdAt",
          sortDir: "desc",
          status: "pending",
        });
        return result.data.map((r) => ({
          id: r.id,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt,
          movie: r.movie,
          reporter: r.user,
        }));
      } catch (err) {
        return toolFailure("listPendingReports", err);
      }
    },
  },
  listPendingRequests: {
    description:
      "List pending movie requests with IDs, titles, and requesters. Use when the admin asks what requests need review.",
    inputSchema: adminChatLimitSchema,
    execute: async ({ limit }: { limit: number }) => {
      try {
        const result = await listAdminRequests({
          page: 1,
          limit,
          sortBy: "createdAt",
          sortDir: "desc",
          status: "pending",
        });
        return result.data.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          externalLink: r.externalLink,
          createdAt: r.createdAt,
          requester: r.user,
        }));
      } catch (err) {
        return toolFailure("listPendingRequests", err);
      }
    },
  },
  searchCatalog: {
    description:
      "Search the movie catalog by title keyword. Returns IDs, titles, slugs, and thumbnails. Use to find a movie's internal ID before suggesting tags.",
    inputSchema: adminChatQuerySchema,
    execute: async ({ query }: { query: string }) => {
      try {
        const result = await searchMovies({ q: query, limit: 5 });
        return result.data.map((m) => ({
          id: m.id,
          title: m.title,
          slug: m.slug,
          thumbnailUrl: m.thumbnailUrl,
        }));
      } catch (err) {
        return toolFailure("searchCatalog", err);
      }
    },
  },
  suggestTags: {
    description:
      "Get a movie's current tags plus every available tag so you can recommend tag assignments. Returns tag IDs and names; reply with your ranked picks and their IDs.",
    inputSchema: adminChatMovieIdSchema,
    execute: async ({ movieId }: { movieId: number }) => {
      try {
        const [current, all] = await Promise.all([
          batchMovieTags([movieId]),
          getAllTags(),
        ]);
        return {
          movieId,
          currentTags: (current.get(movieId) ?? []).map((t) => ({ id: t.id, name: t.name })),
          availableTags: all.map((t) => ({ id: t.id, name: t.name })),
        };
      } catch (err) {
        return toolFailure("suggestTags", err);
      }
    },
  },
  tmdbLookup: {
    description:
      "Look up a title on TMDB. Use when the admin wants to check metadata before importing a movie.",
    inputSchema: adminChatQuerySchema,
    execute: async ({ query }: { query: string }) => {
      try {
        return await searchTMDB(query);
      } catch (err) {
        return toolFailure("tmdbLookup", err);
      }
    },
  },
  getRecentSignups: {
    description:
      "Get recent user signups. Use when the admin asks about new users.",
    inputSchema: adminChatLimitSchema,
    execute: async ({ limit }: { limit: number }) => {
      try {
        return await getRecentSignups(limit);
      } catch (err) {
        return toolFailure("getRecentSignups", err);
      }
    },
  },
  getMostFavorited: {
    description:
      "Get the most favorited movies. Use when the admin asks what is popular with users.",
    inputSchema: adminChatLimitSchema,
    execute: async ({ limit }: { limit: number }) => {
      try {
        return await getMostFavorited(limit);
      } catch (err) {
        return toolFailure("getMostFavorited", err);
      }
    },
  },
};

export const POST = withAdminAuth(async (req, { session }) => {
  const { allowed } = await rateLimit(`admin-chat:${session.user.id}`, RATE_LIMITS.adminChat);
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const parsed = chatApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: ErrorCode.ValidationError } },
      { status: 400 }
    );
  }
  const { messages, model } = parsed.data;

  const result = streamText({
    model: kilocode.languageModel(model || "kilo-auto/free"),
    system: `You are the Streamflix Studio admin assistant. You help admins triage reports and requests, enrich the catalog with tags, and answer analytics questions.

Tool results render as cards in the UI automatically — just acknowledge them naturally.

**Rules:**
- Keep responses concise and operational
- Always cite report, request, and movie IDs when referring to them
- Use listPendingReports for moderation triage, listPendingRequests for the request queue
- Use searchCatalog to find a movie's internal ID, then suggestTags to recommend tags
- Use getDashboardStats, getRecentSignups, and getMostFavorited for analytics questions
- Never use markdown image syntax — the UI handles rendering automatically`,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools: { ...readTools },
    stopWhen: [stepCountIs(3)],
  });

  return result.toUIMessageStreamResponse();
});
