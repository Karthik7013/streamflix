import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { searchMovies } from "@/services/movies";
import { getAllTags, getMoviesByTag } from "@/services/tags";
import { searchMoviesRag } from "@/lib/rag";
import { chatApiSchema } from "@/lib/schemas";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getCachedSession } from "@/lib/session";

export const maxDuration = 30;

const kilocode = createOpenAI({
  baseURL: "https://api.kilo.ai/api/gateway",
  apiKey: process.env.KILOCODE_API_KEY,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: Record<string, any> = {
  searchMovies: {
    description:
      "Search for movies by keyword. Use this when the user asks about movies, wants to find movies, or mentions a topic they want movies about.",
    inputSchema: z.object({
      query: z.string().describe("The search keyword or phrase"),
    }),
    execute: async ({ query }: { query: string }) => {
      const result = await searchMovies({ q: query, limit: 5 });
      return result.data.map((m) => {
        const row = m as typeof m & { tags?: { name: string }[] };
        return {
          title: row.title,
          slug: row.slug,
          thumbnailUrl: row.thumbnailUrl,
          tags: row.tags?.map((t) => t.name) ?? [],
        };
      });
    },
  },
  getMoviesByGenre: {
    description:
      "Get movies by genre/tag. Use this when the user asks for movies in a specific genre like action, comedy, horror, etc.",
    inputSchema: z.object({
      genre: z
        .string()
        .describe(
          "The genre or tag name (e.g., 'action', 'comedy', 'sci-fi')"
        ),
    }),
    execute: async ({ genre }: { genre: string }) => {
      const allTags = await getAllTags();
      const tag = allTags.find(
        (t) => t.name.toLowerCase() === genre.toLowerCase()
      );
      if (!tag) {
        return {
          error: `Genre "${genre}" not found`,
          availableGenres: allTags.map((t) => t.name),
        };
      }
      const result = await getMoviesByTag(tag.slug, 1, 5);
      if ("error" in result) {
        return { error: "Failed to fetch movies", availableGenres: [] };
      }
      return {
        genre: tag.name,
        movies: result.data.map((m) => ({
          title: m.title,
          slug: m.slug,
          thumbnailUrl: m.thumbnailUrl,
        })),
      };
    },
  },
  getAllGenres: {
    description:
      "Get all available genres/tags. Use this when the user wants to know what genres are available.",
    inputSchema: z.object({}),
    execute: async () => {
      const tags = await getAllTags();
      return tags.map((t) => ({
        name: t.name,
        slug: t.slug,
      }));
    },
  },
  searchMoviesByDescription: {
    description:
      "Search the movie catalog by plot, theme, or vibe — not title keywords. " +
      "Use this when the user describes a movie they're thinking of ('a movie about " +
      "someone stranded on Mars', 'a heist film with a twist', 'a feel-good 90s comedy') " +
      "or asks for recommendations based on concepts the title search can't match. " +
      "Results render as movie cards automatically.",
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .default("")
        .describe("The plot, theme, or concept to search for"),
    }),
    execute: async ({ query }: { query?: string }) => {
      if (!query?.trim()) {
        return {
          movies: [],
          sources: [],
          error: "No search query provided",
        };
      }
      const movies = await searchMoviesRag(query, 5);
      return { movies, sources: [] };
    },
  },
  getTrendingMovies: {
    description:
      "Get trending or latest movies. Use this when the user asks about trending, new, popular, or latest movies.",
    inputSchema: z.object({}),
    execute: async () => {
      const result = await searchMovies({
        sortBy: "createdAt",
        sortDir: "desc",
        limit: 5,
      });
      return result.data.map((m) => {
        const row = m as typeof m & { tags?: { name: string }[] };
        return {
          title: row.title,
          slug: row.slug,
          thumbnailUrl: row.thumbnailUrl,
          tags: row.tags?.map((t) => t.name) ?? [],
        };
      });
    },
  },
};

export async function POST(req: Request) {
  const session = await getCachedSession(req as never);
  const userId = session?.user?.id ?? (req.headers.get("x-forwarded-for") ?? "anonymous");
  const { allowed } = await rateLimit(`chat:${userId}`, 5, 60_000);
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const parsed = chatApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }
  const { messages, model } = parsed.data;

  const resolvedModel = model || "kilo-auto/free";

  const result = streamText({
    model: kilocode(resolvedModel),
    system: `You are a helpful assistant for StreamFlix, a streaming platform.
You can search and recommend movies from the StreamFlix catalog.

When tools return movie results, they are automatically displayed as beautiful cards in the UI.
You do NOT need to format results as markdown images or links — just acknowledge the results naturally.

**Rules:**
- Keep responses concise and conversational
- When tools return results, briefly describe what was found (e.g., "Here are some action movies you might enjoy!")
- If no results found, say so and suggest trying a different search
- Recommend content based on what the user is looking for
- Use searchMovies when the user names a title or keyword.
- Use searchMoviesByDescription when the user describes a plot, theme, or vibe instead of a title.
- Never use markdown image syntax — the UI handles rendering automatically`,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools,
    stopWhen: [stepCountIs(2)],
  });

  return result.toUIMessageStreamResponse();
}
