import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { searchMovies } from "@/services/movies";
import { getAllTags, getMoviesByTag } from "@/services/tags";
import { chatApiSchema } from "@/lib/schemas";

export const maxDuration = 30;

const kilocode = createOpenAI({
  baseURL: "https://api.kilo.ai/api/gateway",
  apiKey: process.env.KILOCODE_API_KEY,
});

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

function getModel(provider: string, model: string) {
  switch (provider) {
    case "openrouter":
      return openrouter(model);
    case "kilocode":
    default:
      return kilocode(model);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: Record<string, any> = {
  searchMovies: {
    description:
      "Search for movies by keyword. Use this when the user asks about movies, wants to find movies, or mentions a topic they want movies about.",
    parameters: z.object({
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
    parameters: z.object({
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
    parameters: z.object({}),
    execute: async () => {
      const tags = await getAllTags();
      return tags.map((t) => ({
        name: t.name,
        slug: t.slug,
      }));
    },
  },
  getTrendingMovies: {
    description:
      "Get trending or latest movies. Use this when the user asks about trending, new, popular, or latest movies.",
    parameters: z.object({}),
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
  const body = await req.json();
  const parsed = chatApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }
  const { messages, model, provider } = parsed.data;

  const resolvedProvider = provider === "openrouter" ? "openrouter" : "kilocode";
  const resolvedModel = model || "kilo-auto/free";

  const result = streamText({
    model: getModel(resolvedProvider, resolvedModel),
    system: `You are a helpful assistant for StreamFlix, a streaming platform.
You can search and recommend movies from the StreamFlix catalog.

When tools return movie results, they are automatically displayed as beautiful cards in the UI.
You do NOT need to format results as markdown images or links — just acknowledge the results naturally.

**Rules:**
- Keep responses concise and conversational
- When tools return results, briefly describe what was found (e.g., "Here are some action movies you might enjoy!")
- If no results found, say so and suggest trying a different search
- Recommend content based on what the user is looking for
- Never use markdown image syntax — the UI handles rendering automatically`,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools,
    stopWhen: [stepCountIs(2)],
  });

  return result.toUIMessageStreamResponse();
}
